"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

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

    // Get all students who have room assignments with this teacher
    const students = await prisma.user.findMany({
      where: {
        role: "student",
        roomStudent: {
          some: {
            teacherId: teacherId,
          },
        },
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

    // Get all daily reports for this teacher in this month
    const reports = await prisma.dailyReport.findMany({
      where: {
        activeTeacherId: teacherId,
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

    const teachers = await prisma.user.findMany({
      where: { role: "teacher" },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        username: true,
        roomTeacher: {
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
  search: string = ""
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * pageSize;

    const shiftData = await prisma.shiftTeacherData.findMany({
      where: {
        OR: [
          { student: { firstName: { contains: search, mode: "insensitive" } } },
          {
            student: { fatherName: { contains: search, mode: "insensitive" } },
          },
          { student: { lastName: { contains: search, mode: "insensitive" } } },
          { teacher: { firstName: { contains: search, mode: "insensitive" } } },
          {
            teacher: { fatherName: { contains: search, mode: "insensitive" } },
          },
          { teacher: { lastName: { contains: search, mode: "insensitive" } } },
        ],
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
      where: {
        OR: [
          { student: { firstName: { contains: search, mode: "insensitive" } } },
          {
            student: { fatherName: { contains: search, mode: "insensitive" } },
          },
          { student: { lastName: { contains: search, mode: "insensitive" } } },
          { teacher: { firstName: { contains: search, mode: "insensitive" } } },
          {
            teacher: { fatherName: { contains: search, mode: "insensitive" } },
          },
          { teacher: { lastName: { contains: search, mode: "insensitive" } } },
        ],
      },
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

    if (!teacherId) {
      throw new Error("Teacher ID is required");
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
