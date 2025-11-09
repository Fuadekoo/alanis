"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

interface MonthlySummary {
  month: number;
  label: string;
  total: number;
  present: number;
  absent: number;
  permission: number;
}

interface TeacherSummary {
  teacherId: string;
  teacherName: string;
  total: number;
  absent: number;
}

export async function getReporterAnalytics(year?: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const reporter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!reporter || reporter.role !== "reporter") {
    throw new Error("Access denied");
  }

  const targetYear = year ?? new Date().getFullYear();
  const start = new Date(targetYear, 0, 1);
  const end = new Date(targetYear + 1, 0, 1);

  const [reports, shiftRecords, teacherCount] = await Promise.all([
    prisma.dailyReport.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        date: true,
        learningProgress: true,
        activeTeacher: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.shiftTeacherData.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
    prisma.user.count({
      where: {
        role: "teacher",
      },
    }),
  ]);

  const monthly: MonthlySummary[] = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    label: new Date(2000, index, 1).toLocaleString("en", { month: "short" }),
    total: 0,
    present: 0,
    absent: 0,
    permission: 0,
  }));

  const teacherMap = new Map<string, TeacherSummary>();

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalPermission = 0;

  reports.forEach((report) => {
    const monthIndex = new Date(report.date).getMonth();
    const progress = report.learningProgress;
    const monthSummary = monthly[monthIndex];
    monthSummary.total += 1;

    if (progress === "present") {
      monthSummary.present += 1;
      totalPresent += 1;
    } else if (progress === "permission") {
      monthSummary.permission += 1;
      totalPermission += 1;
    } else if (progress === "absent") {
      monthSummary.absent += 1;
      totalAbsent += 1;
    }

    const teacher = report.activeTeacher;
    if (teacher) {
      const teacherId = teacher.id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacherId,
          teacherName: `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`,
          total: 0,
          absent: 0,
        });
      }
      const summary = teacherMap.get(teacherId)!;
      summary.total += 1;
      if (progress === "absent") {
        summary.absent += 1;
      }
    }
  });

  const totalReports = reports.length;
  const approvalRate =
    totalReports === 0
      ? 0
      : Math.round(((totalPresent + totalPermission) / totalReports) * 1000) /
        10;

  const topTeachers = Array.from(teacherMap.values())
    .sort((a, b) => b.absent - a.absent)
    .slice(0, 7);

  return {
    success: true,
    data: {
      year: targetYear,
      totals: {
        totalReports,
        totalAbsent,
        totalPresent,
        totalPermission,
        totalShifts: shiftRecords,
        teacherCount,
        approvalRate,
      },
      monthly,
      topTeachers,
    },
  };
}
