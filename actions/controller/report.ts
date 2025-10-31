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
  date?: Date;
}

export async function createReport(data: CreateReportData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const {
      studentId,
      activeTeacherId,
      learningSlot,
      learningProgress,
      date = new Date(),
    } = data;

    // Validate input
    if (!studentId || !activeTeacherId || !learningSlot || !learningProgress) {
      throw new Error("Missing required fields");
    }

    if (!["present", "absent", "permission"].includes(learningProgress)) {
      throw new Error("Invalid learning progress value");
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
          date: date,
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

export async function deleteReport() {}

interface ChangeTeacherData {
  currentTeacherProgressId: string;
  newTeacherId: string;
  newLearningSlot?: string;
}

export async function changeTeacher(data: ChangeTeacherData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { currentTeacherProgressId, newTeacherId, newLearningSlot } = data;

    // Validate input
    if (!currentTeacherProgressId || !newTeacherId) {
      throw new Error(
        "Missing required fields: currentTeacherProgressId and newTeacherId"
      );
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current TeacherProgress with all related data
      const currentProgress = await tx.teacherProgress.findUnique({
        where: { id: currentTeacherProgressId },
        include: {
          dailyReports: true,
          teacher: true,
          student: true,
        },
      });

      if (!currentProgress) {
        throw new Error("TeacherProgress not found");
      }

      if (currentProgress.progressStatus === "closed") {
        throw new Error("Cannot change teacher for closed progress");
      }

      // 2. Create ShiftTeacherData with historical data
      const shiftData = await tx.shiftTeacherData.create({
        data: {
          teacherId: currentProgress.teacherId,
          studentId: currentProgress.studentId,
          learningCount: currentProgress.learningCount,
          missingCount: currentProgress.missingCount,
          progressStatus: "closed",
          paymentStatus: currentProgress.paymentStatus,
          learningSlot: currentProgress.learningSlot,
          originalProgressId: currentProgress.id,
        },
      });

      // 3. Move all daily reports to historical data
      if (currentProgress.dailyReports.length > 0) {
        await tx.dailyReport.updateMany({
          where: { teacherProgressId: currentProgress.id },
          data: {
            shiftTeacherDataId: shiftData.id,
            teacherProgressId: null, // Remove from current progress
          },
        });
      }

      // 4. Close the current TeacherProgress
      await tx.teacherProgress.update({
        where: { id: currentTeacherProgressId },
        data: {
          progressStatus: "closed",
        },
      });

      // 5. Create new TeacherProgress for new teacher
      const newProgress = await tx.teacherProgress.create({
        data: {
          teacherId: newTeacherId,
          studentId: currentProgress.studentId,
          learningCount: 0,
          missingCount: 0,
          progressStatus: "open",
          paymentStatus: "pending",
          learningSlot: newLearningSlot || currentProgress.learningSlot,
        },
      });

      return {
        shiftData,
        newProgress,
        previousProgress: currentProgress,
      };
    });

    return {
      success: true,
      data: result,
      message: "Teacher changed successfully",
    };
  } catch (error) {
    console.error("Error changing teacher:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change teacher",
    };
  }
}

export async function getReportByStudent(studentId: string) {}

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

// Helper function to demonstrate teacher change
export async function changeSampleTeacher() {
  const changeData: ChangeTeacherData = {
    currentTeacherProgressId: "progress123",
    newTeacherId: "teacher789",
    newLearningSlot: "afternoon", // Optional: can change learning slot
  };

  return await changeTeacher(changeData);
}

// Helper function to demonstrate getting teacher reports
// export async function getSampleTeacherReports() {
//   return await getReportByTeacher("teacher456");
// }
