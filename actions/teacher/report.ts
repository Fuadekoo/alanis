"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTeacherMonthlyCalendar } from "@/actions/manager/reporter";

async function requireTeacherId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const teacher = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!teacher || teacher.role !== "teacher") {
    throw new Error("Access denied");
  }

  return teacher.id;
}

export async function getTeacherDailyCalendar(year: number, month: number) {
  try {
    const teacherId = await requireTeacherId();
    return await getTeacherMonthlyCalendar(teacherId, year, month);
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
    const teacherId = await requireTeacherId();

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
      throw new Error("You can only approve your own reports");
    }

    if (report.teacherApproved) {
      return {
        success: true,
        data: report,
        message: "Report already approved",
      };
    }

    const updated = await prisma.teacherDailyReport.update({
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
