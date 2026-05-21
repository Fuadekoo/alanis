"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";
import { getMonthRange, toLegacyLearningProgress } from "@/actions/shared/teacherDomain";
import { studentApproveReport as approveReport } from "@/actions/controller/report";

export async function getStudentDailyCalendar(year: number, month: number) {
  try {
    const student = await isAuthorized("student");

    const { startDate, endDate, daysInMonth } = getMonthRange(year, month);

    const reports = await prisma.teacherDailyReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        combination: {
          studentId: student.id,
        },
      },
      select: {
        id: true,
        date: true,
        learningSlot: true,
        attendance: true,
        studentApproved: true,
        teacherApproved: true,
        combination: {
          select: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
                username: true,
              },
            },
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
          username: string;
        };
        reportsByDate: Record<
          number,
          {
            id: string;
            date: Date;
            learningProgress: "present" | "absent" | "permission";
            learningSlot: string | null;
            studentApproved: boolean | null;
            teacherApproved: boolean | null;
          }
        >;
      }
    >();

    for (const report of reports) {
      const teacher = report.combination.teacher;
      const current = teachersMap.get(teacher.id) ?? {
        teacher,
        reportsByDate: {},
      };

      current.reportsByDate[new Date(report.date).getDate()] = {
        id: report.id,
        date: report.date,
        learningProgress: toLegacyLearningProgress(report.attendance),
        learningSlot: report.learningSlot,
        studentApproved: report.studentApproved,
        teacherApproved: report.teacherApproved,
      };

      teachersMap.set(teacher.id, current);
    }

    return {
      success: true,
      data: {
        calendarData: Array.from(teachersMap.values()),
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
  return approveReport(reportId, approved);
}
