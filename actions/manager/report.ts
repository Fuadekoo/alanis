"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Get comprehensive report data for a specific teacher
 * Managers can view reports for any teacher
 */
export async function getReportByTeacher(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only managers can access this function
    if (session.user.role !== "manager") {
      throw new Error("Access denied. Only managers can view teacher reports.");
    }

    // Validate input
    if (!teacherId) {
      throw new Error("Teacher ID is required");
    }

    // Get current open progress for the teacher
    const currentProgress = await prisma.teacherProgress.findMany({
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
            phoneNumber: true,
          },
        },
        dailyReports: {
          orderBy: { date: "desc" },
          take: 10, // Get last 10 reports
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get historical progress from ShiftTeacherData
    const historicalProgress = await prisma.shiftTeacherData.findMany({
      where: {
        teacherId: teacherId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
            phoneNumber: true,
          },
        },
        dailyReports: {
          orderBy: { date: "desc" },
          take: 5, // Get last 5 reports for each historical progress
        },
        originalProgress: {
          select: {
            id: true,
            createdAt: true,
            learningSlot: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary statistics
    const currentStats = {
      totalStudents: currentProgress.length,
      totalLearningCount: currentProgress.reduce(
        (sum, progress) => sum + progress.learningCount,
        0
      ),
      totalMissingCount: currentProgress.reduce(
        (sum, progress) => sum + progress.missingCount,
        0
      ),
      totalReports: currentProgress.reduce(
        (sum, progress) => sum + progress.dailyReports.length,
        0
      ),
    };

    const historicalStats = {
      totalStudents: historicalProgress.length,
      totalLearningCount: historicalProgress.reduce(
        (sum, progress) => sum + progress.learningCount,
        0
      ),
      totalMissingCount: historicalProgress.reduce(
        (sum, progress) => sum + progress.missingCount,
        0
      ),
      totalReports: historicalProgress.reduce(
        (sum, progress) => sum + progress.dailyReports.length,
        0
      ),
    };

    return {
      success: true,
      data: {
        teacher: {
          id: teacherId,
        },
        currentProgress,
        historicalProgress,
        statistics: {
          current: currentStats,
          historical: historicalStats,
          overall: {
            totalStudents:
              currentStats.totalStudents + historicalStats.totalStudents,
            totalLearningCount:
              currentStats.totalLearningCount +
              historicalStats.totalLearningCount,
            totalMissingCount:
              currentStats.totalMissingCount +
              historicalStats.totalMissingCount,
            totalReports:
              currentStats.totalReports + historicalStats.totalReports,
          },
        },
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

/**
 * Get all reports with filtering and pagination
 * Managers can view all reports in the system
 */
export async function getAllReports(
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only managers can access this function
    if (session.user.role !== "manager") {
      throw new Error("Access denied. Only managers can view all reports.");
    }

    const skip = (page - 1) * pageSize;

    const reports = await prisma.dailyReport.findMany({
      where: {
        OR: [
          { student: { firstName: { contains: search, mode: "insensitive" } } },
          { student: { lastName: { contains: search, mode: "insensitive" } } },
          {
            activeTeacher: {
              firstName: { contains: search, mode: "insensitive" },
            },
          },
          {
            activeTeacher: {
              lastName: { contains: search, mode: "insensitive" },
            },
          },
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
          },
        },
        activeTeacher: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    });

    const totalCount = await prisma.dailyReport.count({
      where: {
        OR: [
          { student: { firstName: { contains: search, mode: "insensitive" } } },
          { student: { lastName: { contains: search, mode: "insensitive" } } },
          {
            activeTeacher: {
              firstName: { contains: search, mode: "insensitive" },
            },
          },
          {
            activeTeacher: {
              lastName: { contains: search, mode: "insensitive" },
            },
          },
        ],
      },
    });

    return {
      success: true,
      data: {
        reports,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error getting reports:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reports",
    };
  }
}

/**
 * Get all students for report creation
 * Managers can see all students
 */
export async function getStudentsForReport(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only managers can access this function
    if (session.user.role !== "manager") {
      throw new Error("Access denied. Only managers can access this function.");
    }

    if (!teacherId) {
      throw new Error("Teacher ID is required");
    }

    // Get students who are assigned to this teacher through the room table
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
        phoneNumber: true,
        roomStudent: {
          select: {
            time: true,
            duration: true,
            teacherId: true,
          },
        },
      },
      orderBy: { firstName: "asc" },
    });

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error("Error getting students for teacher:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get students for teacher",
    };
  }
}

/**
 * Get all teachers for report selection
 * Managers can see all teachers
 */
export async function getTeachersForReport() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only managers can access this function
    if (session.user.role !== "manager") {
      throw new Error("Access denied. Only managers can access this function.");
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: "teacher",
        status: { in: ["active", "inactive"] },
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

/**
 * Get report statistics for the dashboard
 * Managers can see all statistics
 */
export async function getReportStatistics() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only managers can access this function
    if (session.user.role !== "manager") {
      throw new Error("Access denied. Only managers can access this function.");
    }

    // Total reports
    const totalReports = await prisma.dailyReport.count();

    // Reports this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const thisMonthReports = await prisma.dailyReport.count({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Reports by status
    const reportsByProgress = await prisma.dailyReport.groupBy({
      by: ["learningProgress"],
      _count: {
        id: true,
      },
    });

    // Active teachers with reports
    const activeTeachersCount = await prisma.user.count({
      where: {
        role: "teacher",
        status: "active",
        teacherProgressAsTeacher: {
          some: {
            progressStatus: "open",
          },
        },
      },
    });

    // Active students with reports
    const activeStudentsCount = await prisma.user.count({
      where: {
        role: "student",
        status: "active",
        teacherProgressAsStudent: {
          some: {
            progressStatus: "open",
          },
        },
      },
    });

    return {
      success: true,
      data: {
        totalReports,
        thisMonthReports,
        reportsByProgress,
        activeTeachersCount,
        activeStudentsCount,
      },
    };
  } catch (error) {
    console.error("Error getting report statistics:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get report statistics",
    };
  }
}

/**
 * Get daily reports by date range
 * Managers can filter reports by date range
 */
export async function getReportsByDateRange(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only managers can access this function
    if (session.user.role !== "manager") {
      throw new Error("Access denied. Only managers can access this function.");
    }

    const skip = (page - 1) * pageSize;

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
          },
        },
        activeTeacher: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { date: "desc" },
      skip,
      take: pageSize,
    });

    const totalCount = await prisma.dailyReport.count({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    return {
      success: true,
      data: {
        reports,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error getting reports by date range:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get reports by date range",
    };
  }
}
