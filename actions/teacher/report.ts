"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTeacherMonthlyCalendar } from "@/actions/manager/reporter";

export async function getTeacherDailyCalendar(year: number, month: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Access denied");
    }

    return await getTeacherMonthlyCalendar(session.user.id, year, month);
  } catch (error) {
    console.error("Error fetching teacher daily calendar:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load daily reports",
    };
  }
}

export async function approveTeacherDailyReport(reportId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        activeTeacherId: true,
        teacherApproved: true,
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (report.activeTeacherId !== session.user.id) {
      throw new Error("You can only approve your own reports");
    }

    if (report.teacherApproved) {
      return {
        success: true,
        data: report,
        message: "Report already approved",
      };
    }

    const updated = await prisma.dailyReport.update({
      where: { id: reportId },
      data: { teacherApproved: true },
    });

    return {
      success: true,
      data: updated,
      message: "Report approved successfully",
    };
  } catch (error) {
    console.error("Error approving report by teacher:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to approve report",
    };
  }
}
