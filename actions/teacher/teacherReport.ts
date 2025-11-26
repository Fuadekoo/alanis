"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

// Get all teacher's students with calendar data for a month
export async function getTeacherStudentsCalendar(year: number, month: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const teacherId = session.user.id;

    // Verify user is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Access denied. Only teachers can access this.");
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

    // Get the first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    const daysInMonth = endDate.getDate();

    // Get all students assigned to this teacher through room table
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
        roomStudent: {
          where: {
            teacherId: teacherId,
          },
          select: {
            time: true,
            duration: true,
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

    // Get all teacher daily reports for students in this month
    const reports =
      studentIds.length === 0
        ? []
        : await prisma.teacherDailyReport.findMany({
            where: {
              teacherId: teacherId,
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
              approved: true,
            },
          });

    // Organize reports by student and date
    const calendarData = students
      .map((student) => {
        const studentReports = reports.filter(
          (r: { studentId: string }) => r.studentId === student.id
        );
        const firstRoom = student.roomStudent[0];

        // Create a map of date -> report
        const reportsByDate: Record<
          number,
          (typeof studentReports)[0] | undefined
        > = {};
        studentReports.forEach((report: { date: Date | string }) => {
          const day = new Date(report.date).getDate();
          reportsByDate[day] = report as (typeof studentReports)[0];
        });

        return {
          student: {
            id: student.id,
            firstName: student.firstName,
            fatherName: student.fatherName,
            lastName: student.lastName,
            username: student.username,
          },
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
    console.error("Error getting teacher students calendar:", error);
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

interface CreateTeacherReportData {
  studentId: string;
  learningProgress: "present" | "absent" | "permission";
  date?: Date | string;
}

// Create a teacher daily report
export async function createTeacherReport(data: CreateTeacherReportData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const teacherId = session.user.id;

    // Verify user is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Access denied. Only teachers can create reports.");
    }

    const { studentId, learningProgress, date } = data;

    // Validate input
    if (!studentId || !learningProgress) {
      throw new Error("Missing required fields");
    }

    if (!["present", "absent", "permission"].includes(learningProgress)) {
      throw new Error("Invalid learning progress value");
    }

    // Verify student is assigned to this teacher
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "student",
        roomStudent: {
          some: {
            teacherId: teacherId,
          },
        },
      },
    });

    if (!student) {
      throw new Error(
        "Student not found or not assigned to you. You can only create reports for your assigned students."
      );
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

    // Check if report already exists for this date
    const existingReport = await prisma.teacherDailyReport.findFirst({
      where: {
        teacherId: teacherId,
        studentId: studentId,
        date: reportDate,
      },
    });

    if (existingReport) {
      throw new Error("A report already exists for this date");
    }

    // Create the teacher daily report
    const teacherDailyReport = await prisma.teacherDailyReport.create({
      data: {
        teacherId: teacherId,
        studentId: studentId,
        date: reportDate,
        learningProgress: learningProgress,
        approved: null, // Initially not approved
      },
    });

    return {
      success: true,
      data: teacherDailyReport,
      message: "Report created successfully",
    };
  } catch (error) {
    console.error("Error creating teacher report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create report",
    };
  }
}

// Delete a teacher daily report
export async function deleteTeacherReport(reportId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const teacherId = session.user.id;

    // Verify user is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Access denied. Only teachers can delete reports.");
    }

    // Get the report to verify it belongs to this teacher
    const report = await prisma.teacherDailyReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        teacherId: true,
        studentId: true,
        date: true,
        learningProgress: true,
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Verify the report belongs to this teacher
    if (report.teacherId !== teacherId) {
      throw new Error("You can only delete your own reports");
    }

    // Delete the report
    await prisma.teacherDailyReport.delete({
      where: { id: reportId },
    });

    return {
      success: true,
      message: "Report deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting teacher report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete report",
    };
  }
}

// Update a teacher daily report
export async function updateTeacherReport(
  reportId: string,
  learningProgress: "present" | "absent" | "permission"
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const teacherId = session.user.id;

    // Verify user is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { role: true },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Access denied. Only teachers can update reports.");
    }

    if (!["present", "absent", "permission"].includes(learningProgress)) {
      throw new Error("Invalid learning progress value");
    }

    // Get the report to verify it belongs to this teacher
    const report = await prisma.teacherDailyReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Verify the report belongs to this teacher
    if (report.teacherId !== teacherId) {
      throw new Error("You can only update your own reports");
    }

    // Update the report
    const updatedReport = await prisma.teacherDailyReport.update({
      where: { id: reportId },
      data: {
        learningProgress: learningProgress,
      },
    });

    return {
      success: true,
      data: updatedReport,
      message: "Report updated successfully",
    };
  } catch (error) {
    console.error("Error updating teacher report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update report",
    };
  }
}
