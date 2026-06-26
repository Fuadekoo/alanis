"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  comboWithRelationsInclude,
  getMonthRange,
  mapReportToCalendarReport,
  parseDateInput,
  toAttendanceStatus,
  toTeacherStudentStatus,
} from "@/actions/shared/teacherDomain";
import { backfillTeacherAbsentForPreviousDay } from "@/actions/shared/absentBackfill";

interface CreateTeacherReportData {
  studentId: string;
  learningProgress: "present" | "absent" | "permission";
  date?: Date | string;
}

function todayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

async function requireTeacherSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const teacher = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!teacher || teacher.role !== "teacher") {
    throw new Error("Access denied. Only teachers can access this.");
  }

  return teacher.id;
}

async function getTeacherRoomAssignment(teacherId: string, studentId: string) {
  return prisma.room.findFirst({
    where: {
      teacherId,
      studentId,
    },
    select: {
      time: true,
      duration: true,
    },
  });
}

export async function getTeacherStudentsCalendar(year: number, month: number) {
  try {
    const teacherId = await requireTeacherSession();

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

    const rooms = await prisma.room.findMany({
      where: { teacherId },
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
            include: reportWithTeacherStudentInclude(),
            orderBy: { date: "asc" },
          });

    const reportMap = new Map<string, Record<number, ReturnType<typeof mapReportToCalendarReport>>>();

    reports.forEach((report) => {
      const studentId = report.combination.studentId;
      const day = new Date(report.date).getUTCDate();
      const studentReports = reportMap.get(studentId) ?? {};
      studentReports[day] = mapReportToCalendarReport(report);
      reportMap.set(studentId, studentReports);
    });

    const calendarData = rooms.map((room) => ({
      student: room.student,
      timeSlot: room.time,
      duration: room.duration,
      reportsByDate: reportMap.get(room.studentId) ?? {},
    }));

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

function reportWithTeacherStudentInclude() {
  return {
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
  } as const;
}

export async function createTeacherReport(data: CreateTeacherReportData) {
  try {
    const teacherId = await requireTeacherSession();
    const { studentId, learningProgress, date } = data;

    if (!studentId || !learningProgress) {
      throw new Error("Missing required fields");
    }

    const room = await getTeacherRoomAssignment(teacherId, studentId);
    if (!room) {
      throw new Error(
        "Student not found or not assigned to you. You can only create reports for your assigned students."
      );
    }

    const reportDate = parseDateInput(date);
    if (reportDate > todayUtc()) {
      throw new Error("Cannot create reports for future dates");
    }

    const combination = await prisma.teacherStudent.upsert({
      where: {
        teacherId_studentId: {
          teacherId,
          studentId,
        },
      },
      update: {
        active: true,
        status: toTeacherStudentStatus("active"),
      },
      create: {
        teacherId,
        studentId,
        active: true,
        status: toTeacherStudentStatus("active"),
      },
      include: comboWithRelationsInclude,
    });

    const existingReport = await prisma.teacherDailyReport.findUnique({
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

    const teacherDailyReport = await prisma.teacherDailyReport.create({
      data: {
        combId: combination.id,
        date: reportDate,
        learningSlot: room.time,
        attendance: toAttendanceStatus(learningProgress),
        teacherApproved: true,
        studentApproved: null,
      },
    });

    // Filling today's attendance auto-closes the previous working day: any of
    // this teacher's students with no report for that day are marked ABSENT.
    // Never blocks/fails the report itself.
    if (reportDate.getTime() === todayUtc().getTime()) {
      try {
        await backfillTeacherAbsentForPreviousDay(teacherId, reportDate);
      } catch (error) {
        console.error(
          "[absent-backfill] failed for teacher",
          teacherId,
          error,
        );
      }
    }

    return {
      success: true,
      data: {
        ...teacherDailyReport,
        learningProgress,
      },
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

export async function deleteTeacherReport(reportId: string) {
  try {
    const teacherId = await requireTeacherSession();

    const report = await prisma.teacherDailyReport.findUnique({
      where: { id: reportId },
      include: {
        combination: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (report.combination.teacherId !== teacherId) {
      throw new Error("You can only delete your own reports");
    }

    if (report.salaryId) {
      throw new Error("This report is already linked to a salary and cannot be deleted");
    }

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

export async function updateTeacherReport(
  reportId: string,
  learningProgress: "present" | "absent" | "permission"
) {
  try {
    const teacherId = await requireTeacherSession();

    const report = await prisma.teacherDailyReport.findUnique({
      where: { id: reportId },
      include: {
        combination: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (report.combination.teacherId !== teacherId) {
      throw new Error("You can only update your own reports");
    }

    if (report.salaryId) {
      throw new Error("This report is already linked to a salary and cannot be updated");
    }

    const updatedReport = await prisma.teacherDailyReport.update({
      where: { id: reportId },
      data: {
        attendance: toAttendanceStatus(learningProgress),
        teacherApproved: true,
      },
    });

    return {
      success: true,
      data: {
        ...updatedReport,
        learningProgress,
      },
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
