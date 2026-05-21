"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Prisma, TeacherStudentStatus, userStatus } from "@prisma/client";
import {
  basicUserSelect,
  buildProgressRecord,
  comboProgressInclude,
  formatUserName,
  getMonthRange,
  mapReportToCalendarReport,
  parseDateInput,
  teacherDailyReportSelect,
  teacherSelect,
  toLegacyLearningProgress,
} from "@/actions/shared/teacherDomain";

type SessionUser = {
  id: string;
  role: string;
};

const studentWithControllerSelect = {
  id: true,
  firstName: true,
  fatherName: true,
  lastName: true,
  username: true,
  phoneNumber: true,
  controller: {
    select: {
      id: true,
      firstName: true,
      fatherName: true,
      lastName: true,
    },
  },
} satisfies Prisma.userSelect;

const comboWithControllerInclude = {
  student: {
    select: studentWithControllerSelect,
  },
  teacher: {
    select: teacherSelect,
  },
  dailyReports: {
    select: teacherDailyReportSelect,
    orderBy: {
      date: "desc",
    },
  },
} satisfies Prisma.TeacherStudentInclude;

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setUTCHours(23, 59, 59, 999);
  return value;
}

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    role: session.user.role,
  } satisfies SessionUser;
}

function getStudentStatusFilter(statusFilter?: string): userStatus | undefined {
  switch (statusFilter) {
    case "new":
    case "active":
    case "inactive":
    case "onProgress":
    case "remedanLeft":
      return statusFilter;
    default:
      return undefined;
  }
}

async function getTeacherComboRecords(
  teacherId: string,
  user: SessionUser,
  includeInactive = true
) {
  return prisma.teacherStudent.findMany({
    where: {
      teacherId,
      ...(includeInactive
        ? {}
        : {
            active: true,
            status: TeacherStudentStatus.ACTIVE,
          }),
      ...(user.role === "controller"
        ? {
            student: {
              controllerId: user.id,
            },
          }
        : {}),
    },
    include: comboWithControllerInclude,
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getTeacherMonthlyCalendar(
  teacherId: string,
  year: number,
  month: number,
  statusFilter?: string
) {
  try {
    const user = await requireSessionUser();

    if (!teacherId || !year || !month) {
      return {
        success: true,
        data: {
          calendarData: [],
          daysInMonth: 0,
          year,
          month,
        },
      };
    }

    const { startDate, endDate, daysInMonth } = getMonthRange(year, month);
    const studentStatus = getStudentStatusFilter(statusFilter);

    const rooms = await prisma.room.findMany({
      where: {
        teacherId,
        student: {
          role: "student",
          ...(studentStatus ? { status: studentStatus } : {}),
          ...(user.role === "controller" ? { controllerId: user.id } : {}),
        },
      },
      select: {
        studentId: true,
        time: true,
        duration: true,
        student: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: [{ time: "asc" }, { student: { firstName: "asc" } }],
    });

    const studentIds = Array.from(new Set(rooms.map((room) => room.studentId)));

    const reports =
      studentIds.length === 0
        ? []
        : await prisma.teacherDailyReport.findMany({
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
              combination: {
                teacherId,
                studentId: {
                  in: studentIds,
                },
              },
            },
            include: {
              combination: {
                select: {
                  studentId: true,
                  teacher: {
                    select: {
                      firstName: true,
                      fatherName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { date: "asc" },
          });

    const reportMap = new Map<string, Record<number, ReturnType<typeof mapReportToCalendarReport>>>();

    for (const report of reports) {
      const studentId = report.combination.studentId;
      const studentReports = reportMap.get(studentId) ?? {};
      studentReports[new Date(report.date).getDate()] =
        mapReportToCalendarReport(report);
      reportMap.set(studentId, studentReports);
    }

    return {
      success: true,
      data: {
        calendarData: rooms.map((room) => ({
          student: room.student,
          timeSlot: room.time,
          duration: room.duration,
          reportsByDate: reportMap.get(room.studentId) ?? {},
        })),
        daysInMonth,
        year,
        month,
      },
    };
  } catch (error) {
    console.error("Error getting teacher monthly calendar:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher monthly calendar",
    };
  }
}

export async function getTeacherDateRangeReportSummary(
  teacherId: string,
  startDate: string,
  endDate: string
) {
  try {
    const user = await requireSessionUser();

    if (!teacherId || !startDate || !endDate) {
      return {
        success: true,
        data: {
          reports: [],
          studentSummaries: [],
          summary: {
            totalReports: 0,
            totalStudents: 0,
            presentCount: 0,
            permissionCount: 0,
            absentCount: 0,
            presentPercentage: 0,
            permissionPercentage: 0,
            absentPercentage: 0,
          },
        },
      };
    }

    const start = parseDateInput(startDate);
    const end = endOfDay(parseDateInput(endDate));

    if (start > end) {
      throw new Error("Start date must be on or before end date");
    }

    const reports = await prisma.teacherDailyReport.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        combination: {
          teacherId,
          ...(user.role === "controller"
            ? {
                student: {
                  controllerId: user.id,
                },
              }
            : {}),
        },
      },
      select: {
        id: true,
        date: true,
        learningSlot: true,
        attendance: true,
        studentApproved: true,
        teacherApproved: true,
        combination: {
          select: {
            studentId: true,
            student: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { combination: { student: { firstName: "asc" } } }],
    });

    const studentSummaryMap = new Map<
      string,
      {
        student: {
          id: string;
          firstName: string;
          fatherName: string;
          lastName: string;
        };
        totalReports: number;
        presentCount: number;
        permissionCount: number;
        absentCount: number;
      }
    >();

    let presentCount = 0;
    let permissionCount = 0;
    let absentCount = 0;

    for (const report of reports) {
      const studentId = report.combination.studentId;
      const current = studentSummaryMap.get(studentId) ?? {
        student: report.combination.student,
        totalReports: 0,
        presentCount: 0,
        permissionCount: 0,
        absentCount: 0,
      };

      current.totalReports += 1;

      const learningProgress = toLegacyLearningProgress(report.attendance);
      if (learningProgress === "present") {
        current.presentCount += 1;
        presentCount += 1;
      } else if (learningProgress === "permission") {
        current.permissionCount += 1;
        permissionCount += 1;
      } else {
        current.absentCount += 1;
        absentCount += 1;
      }

      studentSummaryMap.set(studentId, current);
    }

    const totalReports = reports.length;
    const percentage = (count: number) =>
      totalReports > 0 ? Number(((count / totalReports) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        reports: reports.map((report) => ({
          id: report.id,
          studentId: report.combination.studentId,
          date: report.date,
          learningSlot: report.learningSlot,
          learningProgress: toLegacyLearningProgress(report.attendance),
          studentApproved: report.studentApproved,
          teacherApproved: report.teacherApproved,
          student: report.combination.student,
        })),
        studentSummaries: Array.from(studentSummaryMap.values())
          .map((item) => ({
            ...item,
            presentPercentage: percentage(item.presentCount),
            permissionPercentage: percentage(item.permissionCount),
            absentPercentage: percentage(item.absentCount),
          }))
          .sort((a, b) =>
            formatUserName(a.student).localeCompare(formatUserName(b.student))
          ),
        summary: {
          totalReports,
          totalStudents: studentSummaryMap.size,
          presentCount,
          permissionCount,
          absentCount,
          presentPercentage: percentage(presentCount),
          permissionPercentage: percentage(permissionCount),
          absentPercentage: percentage(absentCount),
        },
      },
    };
  } catch (error) {
    console.error("Error getting teacher date range report summary:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher date range report summary",
    };
  }
}

export async function getTeachersWithControllers() {
  try {
    const user = await requireSessionUser();

    const teachers = await prisma.user.findMany({
      where: {
        role: "teacher",
        ...(user.role === "controller"
          ? {
              roomTeacher: {
                some: {
                  student: {
                    controllerId: user.id,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        roomTeacher: {
          ...(user.role === "controller"
            ? {
                where: {
                  student: {
                    controllerId: user.id,
                  },
                },
              }
            : {}),
          select: {
            student: {
              select: {
                controller: {
                  select: {
                    id: true,
                    firstName: true,
                    fatherName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { firstName: "asc" },
    });

    return {
      success: true,
      data: teachers.map((teacher) => ({
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          fatherName: teacher.fatherName,
          lastName: teacher.lastName,
          username: teacher.username,
        },
        controller: teacher.roomTeacher[0]?.student.controller ?? null,
      })),
    };
  } catch (error) {
    console.error("Error getting teachers with controllers:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teachers with controllers",
    };
  }
}

export async function getAllShiftData(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  teacherId?: string,
  month?: number,
  year?: number
) {
  try {
    await requireSessionUser();

    const where: Prisma.TeacherStudentWhereInput = {
      OR: [
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { fatherName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { fatherName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
      ],
      ...(teacherId ? { teacherId } : {}),
      ...(month || year
        ? {
            updatedAt: {
              gte: new Date(
                year ?? new Date().getFullYear(),
                month ? month - 1 : 0,
                1
              ),
              lt: month
                ? new Date(year ?? new Date().getFullYear(), month, 1)
                : new Date((year ?? new Date().getFullYear()) + 1, 0, 1),
            },
          }
        : {}),
      NOT: {
        active: true,
        status: TeacherStudentStatus.ACTIVE,
      },
    };

    const skip = (page - 1) * pageSize;

    const [combos, totalCount] = await Promise.all([
      prisma.teacherStudent.findMany({
        where,
        include: comboWithControllerInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.teacherStudent.count({ where }),
    ]);

    return {
      success: true,
      data: {
        shiftData: combos.map((combo) => ({
          ...buildProgressRecord(combo),
          createdAt: combo.updatedAt,
        })),
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error getting shift data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get shift data",
    };
  }
}

export async function getTeacherProgressByTeacher(teacherId: string) {
  try {
    const user = await requireSessionUser();

    if (!teacherId?.trim()) {
      return {
        success: true,
        data: [],
      };
    }

    const combos = await getTeacherComboRecords(teacherId, user, false);

    return {
      success: true,
      data: combos.map(buildProgressRecord),
    };
  } catch (error) {
    console.error("Error getting teacher progress:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get teacher progress",
    };
  }
}

export async function getTeacherDailyReportCalendar(
  teacherId: string,
  year: number,
  month: number
) {
  try {
    const user = await requireSessionUser();

    if (!teacherId || !year || !month) {
      return {
        success: true,
        data: {
          calendarData: [],
          daysInMonth: 0,
          year,
          month,
        },
      };
    }

    const { startDate, endDate, daysInMonth } = getMonthRange(year, month);

    const reports = await prisma.teacherDailyReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        combination: {
          teacherId,
          ...(user.role === "controller"
            ? {
                student: {
                  controllerId: user.id,
                },
              }
            : {}),
        },
      },
      select: {
        id: true,
        date: true,
        attendance: true,
        studentApproved: true,
        teacherApproved: true,
        combination: {
          select: {
            studentId: true,
            student: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const studentMap = new Map<
      string,
      {
        student: {
          id: string;
          firstName: string;
          fatherName: string;
          lastName: string;
          username: string;
        };
        reportsByDate: Record<
          number,
          {
            id: string;
            date: Date;
            learningProgress: string;
            approved: boolean | null;
          }
        >;
      }
    >();

    for (const report of reports) {
      const key = report.combination.studentId;
      const current = studentMap.get(key) ?? {
        student: report.combination.student,
        reportsByDate: {},
      };

      current.reportsByDate[new Date(report.date).getDate()] = {
        id: report.id,
        date: report.date,
        learningProgress: toLegacyLearningProgress(report.attendance),
        approved: report.teacherApproved ?? report.studentApproved ?? null,
      };

      studentMap.set(key, current);
    }

    return {
      success: true,
      data: {
        calendarData: Array.from(studentMap.values()),
        daysInMonth,
        year,
        month,
      },
    };
  } catch (error) {
    console.error("Error getting teacher daily report calendar:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher daily report calendar",
    };
  }
}

export async function getAllTeachersForReporter() {
  try {
    const user = await requireSessionUser();

    const teachers = await prisma.user.findMany({
      where: {
        role: "teacher",
        ...(user.role === "controller"
          ? {
              roomTeacher: {
                some: {
                  student: {
                    controllerId: user.id,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
      },
      orderBy: { firstName: "asc" },
    });

    return {
      success: true,
      data: teachers,
    };
  } catch (error) {
    console.error("Error getting teachers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get teachers",
    };
  }
}

export async function getControllersWithTeachers() {
  try {
    const user = await requireSessionUser();

    const controllers = await prisma.user.findMany({
      where: {
        role: "controller",
        ...(user.role === "controller" ? { id: user.id } : {}),
        students: {
          some: {},
        },
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        students: {
          select: {
            roomStudent: {
              select: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    fatherName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    return {
      success: true,
      data: controllers.map((controller) => {
        const teachersMap = new Map<
          string,
          {
            id: string;
            firstName: string;
            fatherName: string;
            lastName: string;
            username: string;
          }
        >();

        for (const student of controller.students) {
          for (const room of student.roomStudent) {
            teachersMap.set(room.teacher.id, room.teacher);
          }
        }

        return {
          controller: {
            id: controller.id,
            firstName: controller.firstName,
            fatherName: controller.fatherName,
            lastName: controller.lastName,
            username: controller.username,
          },
          teachers: Array.from(teachersMap.values()),
        };
      }),
    };
  } catch (error) {
    console.error("Error getting controllers with teachers:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get controllers with teachers",
    };
  }
}

export async function getControllerMonthlyCalendar(
  controllerId: string,
  year: number,
  month: number
) {
  try {
    const user = await requireSessionUser();

    if (!controllerId || !year || !month) {
      throw new Error("Controller ID, year, and month are required");
    }

    if (user.role === "controller" && controllerId !== user.id) {
      throw new Error("Access denied");
    }

    const { startDate, endDate, daysInMonth } = getMonthRange(year, month);

    const students = await prisma.user.findMany({
      where: {
        role: "student",
        controllerId,
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
      },
      orderBy: { firstName: "asc" },
    });

    const studentIds = students.map((student) => student.id);

    const reports =
      studentIds.length === 0
        ? []
        : await prisma.teacherDailyReport.findMany({
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
              combination: {
                studentId: {
                  in: studentIds,
                },
              },
            },
            include: {
              combination: {
                select: {
                  studentId: true,
                  teacher: {
                    select: {
                      firstName: true,
                      fatherName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            orderBy: { date: "asc" },
          });

    const reportMap = new Map<
      string,
      Record<
        number,
        ReturnType<typeof mapReportToCalendarReport> & { teacherName: string }
      >
    >();

    for (const report of reports) {
      const studentId = report.combination.studentId;
      const studentReports = reportMap.get(studentId) ?? {};
      studentReports[new Date(report.date).getDate()] =
        mapReportToCalendarReport(report, true) as ReturnType<
          typeof mapReportToCalendarReport
        > & { teacherName: string };
      reportMap.set(studentId, studentReports);
    }

    return {
      success: true,
      data: {
        calendarData: students.map((student) => ({
          student,
          reportsByDate: reportMap.get(student.id) ?? {},
        })),
        daysInMonth,
        year,
        month,
      },
    };
  } catch (error) {
    console.error("Error getting controller monthly calendar:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get controller monthly calendar",
    };
  }
}
