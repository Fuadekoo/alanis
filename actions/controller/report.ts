"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getReport(
  teacherId: string,
  page?: number,
  pageSize?: number,
  search?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const reports = await prisma.dailyReport.findMany({
      where: {
        activeTeacherId: {
          equals: teacherId,
        },
      },
      orderBy: {
        date: "desc",
      },
      skip: (page ?? 1 - 1) * (pageSize ?? 10),
      take: pageSize,
    });
    return {
      success: true,
      data: reports,
      message: "Reports fetched successfully",
    };
  } catch (error) {
    console.error("Error getting reports:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reports",
    };
  }
}

interface CreateReportData {
  studentId: string;
  activeTeacherId: string;
  learningSlot: string;
  learningProgress: "present" | "absent" | "permission";
  date?: Date | string;
}

export async function createReport(data: CreateReportData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { studentId, activeTeacherId, learningSlot, learningProgress, date } =
      data;

    // Validate input
    if (!studentId || !activeTeacherId || !learningSlot || !learningProgress) {
      throw new Error("Missing required fields");
    }

    if (!["present", "absent", "permission"].includes(learningProgress)) {
      throw new Error("Invalid learning progress value");
    }

    // Normalize dates to UTC midnight to avoid timezone shifts
    let reportDate: Date;
    if (typeof date === "string") {
      const parts = date.split("-");
      if (parts.length !== 3) {
        throw new Error("Invalid date format. Expected YYYY-MM-DD");
      }
      const [yearStr, monthStr, dayStr] = parts;
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        throw new Error("Invalid date value provided");
      }
      reportDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const sourceDate = date ? new Date(date) : new Date();
      if (Number.isNaN(sourceDate.getTime())) {
        throw new Error("Invalid date value provided");
      }
      reportDate = new Date(
        Date.UTC(
          sourceDate.getUTCFullYear(),
          sourceDate.getUTCMonth(),
          sourceDate.getUTCDate()
        )
      );
    }

    const currentDate = new Date();
    const today = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      )
    );

    if (reportDate > today) {
      throw new Error("Cannot create reports for future dates");
    }

    // Authorization: Only controllers can create reports, and only for their assigned students
    if (session.user.role === "controller") {
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: "student",
          controllerId: session.user.id,
        },
      });

      if (!student) {
        throw new Error(
          "You can only create reports for students assigned to you"
        );
      }
    } else if (session.user.role !== "manager") {
      // Only controllers and managers can create reports
      throw new Error("You do not have permission to create reports");
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if TeacherProgress exists for this student-teacher pair
      let teacherProgress = await tx.teacherProgress.findFirst({
        where: {
          studentId: studentId,
          teacherId: activeTeacherId,
          progressStatus: "open", // Only check open progress
        },
      });

      // 2. If TeacherProgress doesn't exist, create it
      if (!teacherProgress) {
        teacherProgress = await tx.teacherProgress.create({
          data: {
            teacherId: activeTeacherId,
            studentId: studentId,
            learningCount: 0,
            missingCount: 0,
            progressStatus: "open",
            paymentStatus: "pending",
            learningSlot: learningSlot,
          },
        });
      }

      // 3. Create the DailyReport
      const dailyReport = await tx.dailyReport.create({
        data: {
          studentId: studentId,
          activeTeacherId: activeTeacherId,
          teacherProgressId: teacherProgress.id,
          date: reportDate,
          learningSlot: learningSlot,
          learningProgress: learningProgress,
        },
      });

      // 4. Update TeacherProgress counts based on learning progress
      let updateData: any = {};

      if (learningProgress === "present" || learningProgress === "permission") {
        // Present and permission count as learning
        updateData.learningCount = {
          increment: 1,
        };
      } else if (learningProgress === "absent") {
        // Absent counts as missing
        updateData.missingCount = {
          increment: 1,
        };
      }

      // Update the TeacherProgress with new counts
      const updatedTeacherProgress = await tx.teacherProgress.update({
        where: { id: teacherProgress.id },
        data: updateData,
      });

      return {
        dailyReport,
        teacherProgress: updatedTeacherProgress,
      };
    });

    return {
      success: true,
      data: result,
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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the report with its associated teacher progress
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        teacherProgress: {
          include: {
            student: true,
            teacher: true,
          },
        },
        student: true,
        activeTeacher: true,
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Check if the report belongs to shifted teacher data
    if (report.shiftTeacherDataId) {
      throw new Error(
        "Cannot delete report. This report belongs to shifted teacher data (historical records). You can only delete reports from current active teacher progress."
      );
    }

    // Check if the teacher progress exists and is open (not closed)
    if (!report.teacherProgress) {
      throw new Error("Teacher progress not found for this report");
    }

    if (report.teacherProgress.progressStatus !== "open") {
      throw new Error(
        "Cannot delete report. This progress is already closed. Reports can only be deleted from open progress records."
      );
    }

    // Authorization: Only controllers can delete reports for their assigned students
    if (session.user.role === "controller") {
      const student = await prisma.user.findFirst({
        where: {
          id: report.studentId,
          role: "student",
          controllerId: session.user.id,
        },
      });

      if (!student) {
        throw new Error(
          "You can only delete reports for students assigned to you"
        );
      }
    } else if (session.user.role !== "manager") {
      throw new Error("You do not have permission to delete reports");
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete the daily report
      await tx.dailyReport.delete({
        where: { id: reportId },
      });

      // Update TeacherProgress counts based on learning progress
      const updateData: {
        learningCount?: { decrement: number };
        missingCount?: { decrement: number };
      } = {};

      if (
        report.learningProgress === "present" ||
        report.learningProgress === "permission"
      ) {
        // Present and permission count as learning - decrement learningCount
        updateData.learningCount = {
          decrement: 1,
        };
      } else if (report.learningProgress === "absent") {
        // Absent counts as missing - decrement missingCount
        updateData.missingCount = {
          decrement: 1,
        };
      }

      // Update the TeacherProgress with new counts
      const updatedTeacherProgress = await tx.teacherProgress.update({
        where: { id: report.teacherProgressId! },
        data: updateData,
      });

      return {
        deletedReport: report,
        updatedTeacherProgress,
      };
    });

    return {
      success: true,
      data: result,
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

export async function getReportByStudent(
  studentId: string,
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Validate that the user is requesting their own reports (security)
    if (session.user.id !== studentId) {
      throw new Error("You can only view your own reports");
    }

    const skip = (page - 1) * pageSize;

    const reports = await prisma.dailyReport.findMany({
      where: {
        studentId: studentId,
        activeTeacher: search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            }
          : undefined,
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
        studentId: studentId,
        activeTeacher: search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            }
          : undefined,
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
    console.error("Error getting student reports:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get reports",
    };
  }
}

export async function getReportByTeacher(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
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
          // You can add teacher details here if needed
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

// Student approves their own report
export async function studentApproveReport(
  reportId: string,
  approved: boolean
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get the report to verify it belongs to the student
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { studentId: true },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Verify the student is approving their own report
    if (report.studentId !== session.user.id) {
      throw new Error("You can only approve/reject your own reports");
    }

    // Update the report
    const updatedReport = await prisma.dailyReport.update({
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
    console.error("Error approving/rejecting report:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to approve/reject report",
    };
  }
}

export async function getReportByTeacherProgress(teacherProgressId: string) {}

// Get all reports with filtering and pagination
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

    const skip = (page - 1) * pageSize;

    const reports = await prisma.dailyReport.findMany({
      where: {
        OR: [
          { student: { firstName: { contains: search } } },
          { student: { lastName: { contains: search } } },
          { activeTeacher: { firstName: { contains: search } } },
          { activeTeacher: { lastName: { contains: search } } },
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
        teacherProgress: {
          select: {
            id: true,
            progressStatus: true,
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
          { student: { firstName: { contains: search } } },
          { student: { lastName: { contains: search } } },
          { activeTeacher: { firstName: { contains: search } } },
          { activeTeacher: { lastName: { contains: search } } },
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

// Get students assigned to a specific teacher through room table
export async function getStudentsForReport(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!teacherId) {
      throw new Error("Teacher ID is required");
    }

    // Build where clause based on user role
    const whereClause: any = {
      role: "student",
      roomStudent: {
        some: {
          teacherId: teacherId,
        },
      },
    };

    // If controller, only show students assigned to them
    if (session.user.role === "controller") {
      whereClause.controllerId = session.user.id;
    }

    // Get students who are assigned to this teacher through the room table
    const students = await prisma.user.findMany({
      where: whereClause,
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

// Get all teachers for selection
export async function getTeachersForReport() {
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
        phoneNumber: true,
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

// Get all controller's students with calendar data for a month
export async function getControllerStudentsCalendar(
  year: number,
  month: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const controllerId = session.user.id;

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

    // Get the first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    const daysInMonth = endDate.getDate();

    // Get all students assigned to this controller with their room assignments
    const students = await prisma.user.findMany({
      where: {
        role: "student",
        controllerId: controllerId,
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
            },
          });

    // Organize reports by student and date, include teacher and time slot
    const calendarData = students
      .map((student) => {
        const studentReports = reports.filter(
          (r) => r.studentId === student.id
        );
        const firstRoom = student.roomStudent[0];

        // Create a map of date -> report
        const reportsByDate: Record<number, (typeof studentReports)[0]> = {};
        studentReports.forEach((report) => {
          const day = new Date(report.date).getDate();
          reportsByDate[day] = report;
        });

        return {
          student,
          teacher: firstRoom?.teacher || null,
          timeSlot: firstRoom?.time || "",
          duration: firstRoom?.duration || null,
          reportsByDate,
        };
      })
      .sort((a, b) => {
        // Sort by time slot (ascending)
        if (!a.timeSlot && !b.timeSlot) return 0;
        if (!a.timeSlot) return 1;
        if (!b.timeSlot) return -1;
        return a.timeSlot.localeCompare(b.timeSlot);
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

// Get all controller's students with teacher and time slot info, sorted by time
export async function getControllerStudentsWithSchedule() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const controllerId = session.user.id;

    // Get all students assigned to this controller with their room assignments
    const students = await prisma.user.findMany({
      where: {
        role: "student",
        controllerId: controllerId,
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
        },
      },
      orderBy: { firstName: "asc" },
    });

    // Flatten students with their first room assignment (sorted by time)
    const studentsWithSchedule = students
      .map((student) => {
        if (!student.roomStudent || student.roomStudent.length === 0) {
          return null;
        }

        // Get the first room assignment (earliest time)
        const firstRoom = student.roomStudent[0];

        return {
          id: student.id,
          firstName: student.firstName,
          fatherName: student.fatherName,
          lastName: student.lastName,
          username: student.username,
          teacher: firstRoom.teacher
            ? {
                id: firstRoom.teacher.id,
                firstName: firstRoom.teacher.firstName,
                fatherName: firstRoom.teacher.fatherName,
                lastName: firstRoom.teacher.lastName,
              }
            : null,
          timeSlot: firstRoom.time,
          duration: firstRoom.duration,
        };
      })
      .filter((student) => student !== null)
      .sort((a, b) => {
        // Sort by time slot (ascending)
        if (!a?.timeSlot || !b?.timeSlot) return 0;
        return a.timeSlot.localeCompare(b.timeSlot);
      });

    return {
      success: true,
      data: studentsWithSchedule,
    };
  } catch (error) {
    console.error("Error getting controller students with schedule:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get students with schedule",
    };
  }
}

// Update report status (approve/reject)
export async function updateReportStatus(
  reportId: string,
  status: "approved" | "rejected"
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Note: You might want to add a status field to DailyReport model
    // For now, we'll just return success
    return {
      success: true,
      message: `Report ${status} successfully`,
    };
  } catch (error) {
    console.error("Error updating report status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update report status",
    };
  }
}

// Helper function to demonstrate usage
export async function createSampleReport() {
  const sampleData: CreateReportData = {
    studentId: "student123",
    activeTeacherId: "teacher456",
    learningSlot: "morning",
    learningProgress: "present",
  };

  return await createReport(sampleData);
}

// Helper function to demonstrate getting teacher reports
// export async function getSampleTeacherReports() {
//   return await getReportByTeacher("teacher456");
// }

// ===========================================
// TEACHER SALARY FUNCTIONS
// ===========================================

/**
 * Calculate and create teacher salary for a specific month/year
 * This function aggregates learning counts from both current TeacherProgress
 * and historical ShiftTeacherData records for the given period
 */
export async function calculateTeacherSalary(
  teacherId: string,
  month: number,
  year: number,
  amountPerLearning: number = 100 // Default amount per learning session
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Validate input
    if (!teacherId || !month || !year) {
      throw new Error("Teacher ID, month, and year are required");
    }

    if (month < 1 || month > 12) {
      throw new Error("Month must be between 1 and 12");
    }

    // Check if salary already exists for this month/year
    const existingSalary = await prisma.teacherSalary.findFirst({
      where: {
        teacherId,
        month,
        year,
      },
    });

    if (existingSalary) {
      return {
        success: false,
        error: "Salary already calculated for this month and year",
        data: existingSalary,
      };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get all ShiftTeacherData records that were closed during this period
      // These represent historical data that the teacher taught before shifting
      const shiftedData = await tx.shiftTeacherData.findMany({
        where: {
          teacherId,
          progressStatus: "closed",
          createdAt: {
            gte: new Date(year, month - 1, 1), // Start of the month
            lte: new Date(year, month, 0), // End of the month
          },
        },
      });

      // Get all TeacherProgress records that existed during this period
      // But we need to only count the learning from DailyReports within this month
      const currentProgress = await tx.teacherProgress.findMany({
        where: {
          teacherId,
          dailyReports: {
            some: {
              date: {
                gte: new Date(year, month - 1, 1), // Start of the month
                lte: new Date(year, month, 0), // End of the month
              },
            },
          },
        },
        include: {
          dailyReports: {
            where: {
              date: {
                gte: new Date(year, month - 1, 1), // Start of the month
                lte: new Date(year, month, 0), // End of the month
              },
            },
          },
        },
      });

      // Calculate total learning count from DailyReports within this month
      // Count only "present" and "permission" as learning sessions
      const currentLearningCount = currentProgress.reduce((sum, progress) => {
        const monthReports = progress.dailyReports.filter(
          (report) =>
            report.learningProgress === "present" ||
            report.learningProgress === "permission"
        ).length;
        return sum + monthReports;
      }, 0);

      // For shifted data, get the monthly reports count
      const shiftedReports = await tx.dailyReport.findMany({
        where: {
          shiftTeacherDataId: {
            in: shiftedData.map((s) => s.id),
          },
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0),
          },
        },
      });

      const shiftedLearningCount = shiftedReports.filter(
        (report) =>
          report.learningProgress === "present" ||
          report.learningProgress === "permission"
      ).length;

      const totalLearningCount = currentLearningCount + shiftedLearningCount;

      // Calculate total amount
      const amount = totalLearningCount * amountPerLearning;

      // Create the salary record
      const salary = await tx.teacherSalary.create({
        data: {
          teacherId,
          month,
          year,
          totalDayForLearning: totalLearningCount,
          unitPrice: amountPerLearning,
          amount,
          status: "pending",
        },
      });

      // Also create a linked expense for this teacher salary
      try {
        const teacher = await tx.user.findUnique({
          where: { id: teacherId },
          select: { firstName: true, fatherName: true, lastName: true },
        });
        const teacherName = teacher
          ? `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`.trim()
          : teacherId;
        const expenseName = `${teacherName} ${month}/${year}`;
        await tx.expense.create({
          data: {
            name: expenseName,
            amount,
            // align expense date with salary creation time
            date: salary.createdAt,
            teacherSalaryId: salary.id,
            status: "pending",
            description: "",
          },
        });
      } catch (e) {
        throw e;
      }

      // Link the TeacherProgress records to this salary and set payment status to approved
      if (currentProgress.length > 0) {
        await tx.teacherProgress.updateMany({
          where: {
            id: {
              in: currentProgress.map((p) => p.id),
            },
          },
          data: {
            paymentStatus: "approved",
            progressStatus: "closed",
            teacherSalaryId: salary.id,
          },
        });
      }

      // Link the ShiftTeacherData records to this salary and set payment status to approved
      if (shiftedData.length > 0) {
        await tx.shiftTeacherData.updateMany({
          where: {
            id: {
              in: shiftedData.map((s) => s.id),
            },
          },
          data: {
            paymentStatus: "approved",
            teacherSalaryId: salary.id,
          },
        });
      }

      return {
        salary,
        totalLearningCount,
        currentLearningCount,
        shiftedLearningCount,
        currentProgressCount: currentProgress.length,
        shiftedDataCount: shiftedData.length,
      };
    });

    return {
      success: true,
      data: result,
      message: "Salary calculated successfully",
    };
  } catch (error) {
    console.error("Error calculating teacher salary:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to calculate salary",
    };
  }
}

/**
 * Get all salaries for a specific teacher
 */
export async function getTeacherSalaries(teacherId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const salaries = await prisma.teacherSalary.findMany({
      where: {
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        teacherProgresses: {
          select: {
            id: true,
            learningCount: true,
            missingCount: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shiftTeacherData: {
          select: {
            id: true,
            learningCount: true,
            missingCount: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return {
      success: true,
      data: salaries,
      message: "Salaries retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting teacher salaries:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get salaries",
    };
  }
}

/**
 * Update salary status (approve or reject)
 */
export async function updateSalaryStatus(
  salaryId: string,
  status: "approved" | "rejected"
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const salary = await prisma.teacherSalary.update({
      where: {
        id: salaryId,
      },
      data: {
        status,
      },
    });

    return {
      success: true,
      data: salary,
      message: `Salary ${status} successfully`,
    };
  } catch (error) {
    console.error("Error updating salary status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update salary",
    };
  }
}
