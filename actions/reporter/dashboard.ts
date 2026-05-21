"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";
import {
  AttendanceStatus,
  TeacherStudentStatus,
} from "@prisma/client";

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
  await isAuthorized("reporter");

  const targetYear = year ?? new Date().getFullYear();
  const start = new Date(targetYear, 0, 1);
  const end = new Date(targetYear + 1, 0, 1);

  const [reports, shiftRecords, teacherCount] = await Promise.all([
    prisma.teacherDailyReport.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        date: true,
        attendance: true,
        combination: {
          select: {
            teacher: {
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
    }),
    prisma.teacherStudent.count({
      where: {
        OR: [
          { active: false },
          { status: TeacherStudentStatus.INACTIVE },
        ],
        updatedAt: {
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

  for (const report of reports) {
    const monthIndex = new Date(report.date).getMonth();
    const monthSummary = monthly[monthIndex];
    monthSummary.total += 1;

    if (report.attendance === AttendanceStatus.PRESENT) {
      monthSummary.present += 1;
      totalPresent += 1;
    } else if (report.attendance === AttendanceStatus.PERMISSION) {
      monthSummary.permission += 1;
      totalPermission += 1;
    } else {
      monthSummary.absent += 1;
      totalAbsent += 1;
    }

    const teacher = report.combination.teacher;
    const teacherId = teacher.id;
    const current = teacherMap.get(teacherId) ?? {
      teacherId,
      teacherName:
        `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`.trim(),
      total: 0,
      absent: 0,
    };

    current.total += 1;
    if (report.attendance === AttendanceStatus.ABSENT) {
      current.absent += 1;
    }

    teacherMap.set(teacherId, current);
  }

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
