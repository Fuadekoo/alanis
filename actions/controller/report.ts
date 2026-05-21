"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ensureOpenControllerAssignmentHistory } from "@/lib/assignmentHistory";
import {
  buildProgressRecord,
  buildProgressStatistics,
  comboProgressInclude,
  getMonthRange,
  mapReportToCalendarReport,
  parseDateInput,
  toAttendanceStatus,
} from "@/actions/shared/teacherDomain";
import { Prisma, TeacherStudentStatus, userStatus } from "@prisma/client";

interface CreateReportData {
  studentId: string;
  activeTeacherId: string;
  learningSlot: string;
  learningProgress: "present" | "absent" | "permission";
  date?: Date | string;
}

type SessionUser = {
  id: string;
  role: string;
};

function todayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

async function requireUser() {
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

function getControllerStudentScope(controllerId: string): Prisma.userWhereInput {
  return {
    OR: [{ controllerId }, { controllerId: null }],
  };
}

export async function createReport(data: CreateReportData) {
  try {
    const user = await requireUser();

    if (user.role !== "controller" && user.role !== "manager") {
      throw new Error("You do not have permission to create reports");
    }

    const { studentId, activeTeacherId, learningProgress, date } = data;

    if (!studentId || !activeTeacherId || !learningProgress) {
      throw new Error("Missing required fields");
    }

    const reportDate = parseDateInput(date);
    if (reportDate > todayUtc()) {
      throw new Error("Cannot create reports for future dates");
    }

    const dailyReport = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findFirst({
        where: {
          studentId,
          teacherId: activeTeacherId,
          ...(user.role === "controller"
            ? {
                student: getControllerStudentScope(user.id),
              }
            : {}),
        },
        select: {
          time: true,
          student: {
            select: {
              controllerId: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error(
          "Student not found or not assigned to the selected teacher"
        );
      }

      if (user.role === "controller" && !room.student.controllerId) {
        await tx.user.update({
          where: { id: studentId },
          data: {
            controllerId: user.id,
          },
        });

        await ensureOpenControllerAssignmentHistory(tx, {
          studentId,
          controllerId: user.id,
        });
      }

      const combination = await tx.teacherStudent.upsert({
        where: {
          teacherId_studentId: {
            teacherId: activeTeacherId,
            studentId,
          },
        },
        update: {
          active: true,
          status: TeacherStudentStatus.ACTIVE,
        },
        create: {
          teacherId: activeTeacherId,
          studentId,
          active: true,
          status: TeacherStudentStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      const existingReport = await tx.teacherDailyReport.findUnique({
        where: {
          combId_date: {
            combId: combination.id,
            date: reportDate,
          },
        },
        select: { id: true },
      });

      if (existingReport) {
        throw new Error("A report already exists for this date");
      }

      return tx.teacherDailyReport.create({
        data: {
          combId: combination.id,
          date: reportDate,
          learningSlot: room.time,
          attendance: toAttendanceStatus(learningProgress),
        },
      });
    });

    return {
      success: true,
      data: {
        ...dailyReport,
        learningProgress,
      },
      message: "Report created successfully",
    };
  } catch (error) {
    console.error("Error creating report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create report",
    };
  }
}

export async function deleteReport(reportId: string) {
  try {
    const user = await requireUser();

    if (user.role !== "controller" && user.role !== "manager") {
      throw new Error("You do not have permission to delete reports");
    }

    const report = await prisma.teacherDailyReport.findUnique({
      where: { id: reportId },
      include: {
        combination: {
          select: {
            student: {
              select: {
                controllerId: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (
      user.role === "controller" &&
      report.combination.student.controllerId &&
      report.combination.student.controllerId !== user.id
    ) {
      throw new Error("You can only delete reports for your students");
    }

    if (report.salaryId) {
      throw new Error(
        "This report is already linked to a salary and cannot be deleted"
      );
    }

    await prisma.teacherDailyReport.delete({
      where: { id: reportId },
    });

    return {
      success: true,
      message: "Report deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete report",
    };
  }
}

export async function getReportByTeacher(teacherId: string) {
  try {
    const user = await requireUser();

    if (!teacherId) {
      throw new Error("Teacher ID is required");
    }

    const combos = await prisma.teacherStudent.findMany({
      where: {
        teacherId,
        ...(user.role === "controller"
          ? {
              student: {
                ...getControllerStudentScope(user.id),
              },
            }
          : {}),
      },
      include: comboProgressInclude,
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    });

    const currentProgress = combos
      .filter(
        (combo) =>
          combo.active && combo.status === TeacherStudentStatus.ACTIVE
      )
      .map(buildProgressRecord);

    const historicalProgress = combos
      .filter(
        (combo) =>
          !combo.active || combo.status !== TeacherStudentStatus.ACTIVE
      )
      .map(buildProgressRecord);

    return {
      success: true,
      data: {
        teacher: {
          id: teacherId,
        },
        currentProgress,
        historicalProgress,
        statistics: buildProgressStatistics(
          currentProgress,
          historicalProgress
        ),
      },
      message: "Teacher progress data retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting teacher progress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher progress",
    };
  }
}

export async function studentApproveReport(
  reportId: string,
  approved: boolean
) {
  try {
    const user = await requireUser();

    if (user.role !== "student") {
      throw new Error("Only students can approve reports");
    }

    const report = await prisma.teacherDailyReport.findUnique({
      where: { id: reportId },
      include: {
        combination: {
          select: {
            studentId: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (report.combination.studentId !== user.id) {
      throw new Error("You can only approve your own reports");
    }

    const updatedReport = await prisma.teacherDailyReport.update({
      where: { id: reportId },
      data: {
        studentApproved: approved,
      },
    });

    return {
      success: true,
      data: updatedReport,
      message: approved
        ? "Report approved successfully"
        : "Report rejected successfully",
    };
  } catch (error) {
    console.error("Error approving report:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to approve report",
    };
  }
}

export async function getControllerStudentsCalendar(
  year: number,
  month: number,
  statusFilter?: string
) {
  try {
    const user = await requireUser();

    if (user.role !== "controller") {
      throw new Error("Access denied");
    }

    if (!year || !month) {
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

    const students = await prisma.user.findMany({
      where: {
        role: "student",
        ...getControllerStudentScope(user.id),
        ...(studentStatus ? { status: studentStatus } : {}),
        roomStudent: {
          some: {},
        },
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        roomStudent: {
          select: {
            time: true,
            duration: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            time: "asc",
          },
          take: 1,
        },
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
                  teacherId: true,
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

    const calendarData = students
      .map((student) => {
        const firstRoom = student.roomStudent[0];
        const reportsByDate: Record<
          number,
          ReturnType<typeof mapReportToCalendarReport> | undefined
        > = {};

        if (firstRoom?.teacher) {
          for (const report of reports) {
            if (
              report.combination.studentId === student.id &&
              report.combination.teacherId === firstRoom.teacher.id
            ) {
              reportsByDate[new Date(report.date).getDate()] =
                mapReportToCalendarReport(report);
            }
          }
        }

        return {
          student: {
            id: student.id,
            firstName: student.firstName,
            fatherName: student.fatherName,
            lastName: student.lastName,
            username: student.username,
          },
          teacher: firstRoom?.teacher ?? null,
          timeSlot: firstRoom?.time ?? "",
          duration: firstRoom?.duration ?? null,
          reportsByDate,
        };
      })
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    return {
      success: true,
      data: {
        calendarData,
        daysInMonth,
        year,
        month,
      },
    };
  } catch (error) {
    console.error("Error getting controller students calendar:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get students calendar",
      data: {
        calendarData: [],
        daysInMonth: 0,
        year,
        month,
      },
    };
  }
}
