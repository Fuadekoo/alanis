"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * Get calendar-style report for a teacher for a specific month
 * Returns students with their daily reports organized by date
 */
export async function getTeacherMonthlyCalendar(
  teacherId: string,
  year: number,
  month: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!teacherId || !year || !month) {
      throw new Error("Teacher ID, year, and month are required");
    }

    // Get the first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    const daysInMonth = endDate.getDate();

    const isController = session.user.role === "controller";

    const studentWhere: Prisma.userWhereInput = {
      role: "student",
      roomStudent: {
        some: {
          teacherId: teacherId,
        },
      },
    };

    if (isController) {
      studentWhere.controllerId = session.user.id;
    }

    // Get all students who have room assignments with this teacher
    const students = await prisma.user.findMany({
      where: studentWhere,
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

    // Get all daily reports for this teacher in this month
    const reports =
      studentIds.length === 0
        ? []
        : await prisma.dailyReport.findMany({
            where: {
              activeTeacherId: teacherId,
              studentId: {
                in: studentIds,
              },
              date: {
                gte: startDate,
                lte: new Date(year, month, 0, 23, 59, 59), // End of last day
              },
            },
            select: {
              id: true,
              studentId: true,
              date: true,
              learningProgress: true,
              learningSlot: true,
              studentApproved: true,
              teacherApproved: true,
            },
          });

    // Organize reports by student and date
    const calendarData = students.map((student) => {
      const studentReports = reports.filter((r) => r.studentId === student.id);

      // Create a map of date -> report
      const reportsByDate: Record<number, (typeof studentReports)[0]> = {};
      studentReports.forEach((report) => {
        const day = new Date(report.date).getDate();
        reportsByDate[day] = report;
      });

      return {
        student,
        reportsByDate,
      };
    });

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

/**
 * Get list of teachers with their controller assignments
 * For reporter to select which teacher to view
 */
export async function getTeachersWithControllers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const isController = session.user.role === "controller";

    const teacherWhere: Prisma.userWhereInput = {
      role: "teacher",
    };

    if (isController) {
      teacherWhere.roomTeacher = {
        some: {
          student: {
            controllerId: session.user.id,
          },
        },
      };
    }

    const teachers = await prisma.user.findMany({
      where: teacherWhere,
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        roomTeacher: {
          ...(isController
            ? {
                where: {
                  student: {
                    controllerId: session.user.id,
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

    // Get unique teacher-controller pairs
    const teacherControllerPairs = teachers.map((teacher) => {
      const controller = teacher.roomTeacher[0]?.student?.controller || null;
      return {
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          fatherName: teacher.fatherName,
          lastName: teacher.lastName,
          username: teacher.username,
        },
        controller,
      };
    });

    return {
      success: true,
      data: teacherControllerPairs,
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

/**
 * Get all shift teacher data (historical records)
 * For reporter to view teacher-student shifts
 */
export async function getAllShiftData(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  teacherId?: string,
  month?: number,
  year?: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * pageSize;

    const baseWhere: Prisma.ShiftTeacherDataWhereInput = {
      OR: [
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { fatherName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { fatherName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
      ],
    };

    const extraFilters: Prisma.ShiftTeacherDataWhereInput[] = [];
    if (teacherId) {
      extraFilters.push({ teacherId });
    }

    if (month || year) {
      const filterYear = year ?? new Date().getFullYear();
      let startDate = new Date(filterYear, 0, 1);
      let endDate = new Date(filterYear + 1, 0, 1);

      if (month) {
        startDate = new Date(filterYear, month - 1, 1);
        endDate = new Date(filterYear, month, 1);
      }

      extraFilters.push({
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      });
    }

    const where: Prisma.ShiftTeacherDataWhereInput = {
      AND: [baseWhere, ...extraFilters],
    };

    const shiftData = await prisma.shiftTeacherData.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
          },
        },
        dailyReports: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const totalCount = await prisma.shiftTeacherData.count({
      where,
    });

    return {
      success: true,
      data: {
        shiftData,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error getting shift data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get shift teacher data",
    };
  }
}

/**
 * Get all active teacher progress for a specific teacher
 * For reporter to view current teaching assignments
 */
export async function getTeacherProgressByTeacher(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Return empty data if no teacherId is provided (instead of throwing error)
    if (!teacherId || teacherId.trim() === "") {
      return {
        success: true,
        data: [],
      };
    }

    const teacherProgress = await prisma.teacherProgress.findMany({
      where: {
        teacherId: teacherId,
        progressStatus: "open",
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
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
        teacher: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
          },
        },
        dailyReports: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: teacherProgress,
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

/**
 * Get all teachers for reporter
 */
export async function getAllTeachersForReporter() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const teachers = await prisma.user.findMany({
      where: { role: "teacher" },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        _count: {
          select: {
            teacherProgressAsTeacher: {
              where: { progressStatus: "open" },
            },
          },
        },
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

/**
 * Get list of controllers with their teachers
 * For reporter to select which controller to view
 */
export async function getControllersWithTeachers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get all controllers who have students assigned
    const controllers = await prisma.user.findMany({
      where: {
        role: "controller",
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
              take: 1,
            },
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    // Get unique controller-teacher pairs
    const controllerTeacherPairs = controllers.map((controller) => {
      // Get unique teachers from all students
      const teachersMap = new Map();
      controller.students.forEach((student) => {
        student.roomStudent.forEach((room) => {
          if (room.teacher) {
            teachersMap.set(room.teacher.id, room.teacher);
          }
        });
      });

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
    });

    return {
      success: true,
      data: controllerTeacherPairs,
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

/**
 * Get calendar-style report for a controller for a specific month
 * Returns all students under this controller with their daily reports organized by date and teacher
 */
export async function getControllerMonthlyCalendar(
  controllerId: string,
  year: number,
  month: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!controllerId || !year || !month) {
      throw new Error("Controller ID, year, and month are required");
    }

    // Get the first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    const daysInMonth = endDate.getDate();

    // Get all students assigned to this controller
    const students = await prisma.user.findMany({
      where: {
        role: "student",
        controllerId: controllerId,
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        roomStudent: {
          select: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { firstName: "asc" },
    });

    const studentIds = students.map((student) => student.id);

    // Get all daily reports for students under this controller in this month
    const reports =
      studentIds.length === 0
        ? []
        : await prisma.dailyReport.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
              date: {
                gte: startDate,
                lte: new Date(year, month, 0, 23, 59, 59), // End of last day
              },
            },
            select: {
              id: true,
              studentId: true,
              activeTeacherId: true,
              date: true,
              learningProgress: true,
              learningSlot: true,
              studentApproved: true,
              teacherApproved: true,
              activeTeacher: {
                select: {
                  id: true,
                  firstName: true,
                  fatherName: true,
                  lastName: true,
                },
              },
            },
          });

    // Organize reports by student and date
    const calendarData = students.map((student) => {
      const studentReports = reports.filter((r) => r.studentId === student.id);

      // Create a map of date -> report
      const reportsByDate: Record<
        number,
        (typeof studentReports)[0] & { teacherName?: string }
      > = {};
      studentReports.forEach((report) => {
        const day = new Date(report.date).getDate();
        const teacherName = report.activeTeacher
          ? `${report.activeTeacher.firstName} ${report.activeTeacher.fatherName} ${report.activeTeacher.lastName}`
          : "";
        reportsByDate[day] = { ...report, teacherName };
      });

      return {
        student,
        reportsByDate,
      };
    });

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
