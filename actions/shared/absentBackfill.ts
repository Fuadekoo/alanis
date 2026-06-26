import "server-only";

import {
  AttendanceStatus,
  skipDateName,
  TeacherStudentStatus,
} from "@prisma/client";
import prisma from "@/lib/db";

function isWeekend(date: Date) {
  const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/**
 * Resolve the most recent day strictly before `today` that is a weekday and is
 * not flagged as a whole-day holiday. Walks back up to `lookbackDays` days so a
 * weekend or a short holiday stretch is skipped. Returns the UTC-midnight Date
 * for that day, or null if no working day is found inside the window.
 *
 * Date keys across the app (daily reports, monthly calendar) are stored at UTC
 * midnight, so the returned key lines up with the teacher's PRESENT reports and
 * the report views.
 */
async function findPreviousWorkingDay(today: Date, lookbackDays = 7) {
  const cursor = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    ),
  );

  for (let i = 0; i < lookbackDays; i += 1) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (isWeekend(cursor)) continue;

    const dayStart = new Date(cursor);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const holiday = await prisma.skipDate.findFirst({
      where: {
        name: skipDateName.wholeDay,
        date: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true },
    });

    if (!holiday) return dayStart;
  }

  return null;
}

/**
 * When a teacher fills attendance for the current day, close out the previous
 * working day: every ACTIVE combination of that teacher that has no report yet
 * is marked ABSENT. This is the per-teacher, on-fill replacement for the nightly
 * absent-cron — the missing day is settled the moment the teacher starts the
 * next day instead of waiting for a scheduled job.
 *
 *  - Scoped to the given teacher only, so other teachers who report later in the
 *    day are not prematurely marked absent.
 *  - Skips weekends and whole-day holidays.
 *  - Only touches combinations that already existed on the previous day.
 *  - Never overwrites an existing report (PRESENT / PERMISSION / manual ABSENT)
 *    thanks to the (combId, date) unique constraint + skipDuplicates.
 *
 * Safe to call repeatedly and idempotent.
 */
export async function backfillTeacherAbsentForPreviousDay(
  teacherId: string,
  today: Date,
) {
  const previousDay = await findPreviousWorkingDay(today);
  if (!previousDay) {
    return { created: 0, date: null as Date | null };
  }

  const dayEnd = new Date(previousDay);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  // Active relationships that already existed on the previous day are eligible.
  const combinations = await prisma.teacherStudent.findMany({
    where: {
      teacherId,
      active: true,
      status: TeacherStudentStatus.ACTIVE,
      createdAt: { lt: dayEnd },
    },
    select: { id: true, studentId: true },
  });
  if (combinations.length === 0) {
    return { created: 0, date: previousDay };
  }

  const comboIds = combinations.map((combo) => combo.id);

  // Combinations that already have a report for the day must be left untouched.
  const existingReports = await prisma.teacherDailyReport.findMany({
    where: { date: previousDay, combId: { in: comboIds } },
    select: { combId: true },
  });
  const reportedCombIds = new Set(existingReports.map((report) => report.combId));

  const toCreate = combinations.filter(
    (combo) => !reportedCombIds.has(combo.id),
  );
  if (toCreate.length === 0) {
    return { created: 0, date: previousDay };
  }

  // Map each student to the teacher's earliest room slot (used as learningSlot).
  const rooms = await prisma.room.findMany({
    where: { teacherId, studentId: { in: toCreate.map((c) => c.studentId) } },
    select: { studentId: true, time: true },
    orderBy: { time: "asc" },
  });
  const timeByStudent = new Map<string, string>();
  for (const room of rooms) {
    if (!timeByStudent.has(room.studentId)) {
      timeByStudent.set(room.studentId, room.time);
    }
  }

  const result = await prisma.teacherDailyReport.createMany({
    data: toCreate.map((combo) => ({
      combId: combo.id,
      date: previousDay,
      learningSlot: timeByStudent.get(combo.studentId) ?? null,
      attendance: AttendanceStatus.ABSENT,
    })),
    skipDuplicates: true,
  });

  return { created: result.count, date: previousDay };
}
