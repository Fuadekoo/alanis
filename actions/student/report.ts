"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { studentApproveReport as controllerApproveReport } from "@/actions/controller/report";

export async function getStudentDailyCalendar(year: number, month: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!student || student.role !== "student") {
      throw new Error("Access denied");
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const daysInMonth = endDate.getDate();

    const reports = await prisma.dailyReport.findMany({
      where: {
        studentId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        learningProgress: true,
        learningSlot: true,
        studentApproved: true,
        teacherApproved: true,
        activeTeacherId: true,
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
      orderBy: { date: "asc" },
    });

    const teachersMap = new Map<
      string,
      {
        teacher: {
          id: string;
          firstName: string;
          fatherName: string;
          lastName: string;
          username: string | null;
        };
        reportsByDate: Record<number, (typeof reports)[number]>;
      }
    >();

    reports.forEach((report) => {
      const teacherId = report.activeTeacherId;
      if (!teacherId || !report.activeTeacher) return;

      if (!teachersMap.has(teacherId)) {
        teachersMap.set(teacherId, {
          teacher: {
            id: report.activeTeacher.id,
            firstName: report.activeTeacher.firstName,
            fatherName: report.activeTeacher.fatherName,
            lastName: report.activeTeacher.lastName,
            username: report.activeTeacher.username ?? null,
          },
          reportsByDate: {},
        });
      }

      const entry = teachersMap.get(teacherId)!;
      const day = new Date(report.date).getDate();
      entry.reportsByDate[day] = report;
    });

    const calendarData = Array.from(teachersMap.values());

    return {
      success: true,
      data: {
        calendarData,
        daysInMonth,
        month,
        year,
      },
    };
  } catch (error) {
    console.error("Error fetching student calendar:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load daily reports",
    };
  }
}

export async function studentApproveReport(
  reportId: string,
  approved: boolean
) {
  return controllerApproveReport(reportId, approved);
}
