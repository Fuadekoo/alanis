import cron from "node-cron";
import {
  AttendanceStatus,
  skipDateName,
  TeacherStudentStatus,
} from "@prisma/client";
import prisma from "./lib/db.js";

/**
 * Returns the UTC-midnight Date for the day before `reference` (defaults to now).
 * Date keys across the app (daily reports, monthly calendar) are stored at UTC
 * midnight, so absent records must use the exact same key to line up with the
 * teacher's auto-saved PRESENT reports and the report views.
 */
function getYesterdayUtc(reference = new Date()) {
  const today = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate()
    )
  );
  today.setUTCDate(today.getUTCDate() - 1);
  return today;
}

function isWeekend(date: Date) {
  const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/**
 * For the given day (Monday–Friday), mark every ACTIVE teacher–student
 * combination that has no daily report as ABSENT. One report per combination
 * per day.
 *
 *  - Only active combinations (active = true AND status = ACTIVE) are touched —
 *    inactive/closed pairs are ignored.
 *  - Skips weekends (no classes on Saturday/Sunday).
 *  - Skips a day flagged as a whole-day holiday in `skipDate`.
 *  - Never creates new combinations and never overwrites an existing report
 *    (controller edits / auto-saved PRESENT stay intact) thanks to the
 *    (combId, date) unique constraint + skipDuplicates.
 *
 * Returns a small summary so it can be called manually (e.g. from an admin
 * action) and logged.
 */
export async function markAbsentForDate(targetDate: Date) {
  if (isWeekend(targetDate)) {
    return { skipped: "weekend" as const, created: 0, date: targetDate };
  }

  const dayStart = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate()
    )
  );
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const holiday = await prisma.skipDate.findFirst({
    where: {
      name: skipDateName.wholeDay,
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true },
  });
  if (holiday) {
    return { skipped: "holiday" as const, created: 0, date: dayStart };
  }

  // Only currently-active learning relationships are eligible for an absence.
  const combinations = await prisma.teacherStudent.findMany({
    where: { active: true, status: TeacherStudentStatus.ACTIVE },
    select: { id: true, teacherId: true, studentId: true },
  });

  if (combinations.length === 0) {
    return { skipped: false as const, created: 0, date: dayStart };
  }

  const pairKey = (teacherId: string, studentId: string) =>
    `${teacherId}::${studentId}`;

  // Map each pair to its scheduled time slot (used as the report's learningSlot).
  // A pair may have several rooms; keep the earliest slot. Pairs without a room
  // still get an absence, just with no slot label.
  const rooms = await prisma.room.findMany({
    select: { teacherId: true, studentId: true, time: true },
    orderBy: { time: "asc" },
  });
  const timeByPair = new Map<string, string>();
  for (const room of rooms) {
    const key = pairKey(room.teacherId, room.studentId);
    if (!timeByPair.has(key)) timeByPair.set(key, room.time);
  }

  const comboIds = combinations.map((combo) => combo.id);

  // Combinations that already have a report for the day must be left untouched.
  const existingReports = await prisma.teacherDailyReport.findMany({
    where: { date: dayStart, combId: { in: comboIds } },
    select: { combId: true },
  });
  const reportedCombIds = new Set(existingReports.map((r) => r.combId));

  const toCreate = combinations.filter(
    (combo) => !reportedCombIds.has(combo.id)
  );

  if (toCreate.length === 0) {
    return { skipped: false as const, created: 0, date: dayStart };
  }

  const result = await prisma.teacherDailyReport.createMany({
    data: toCreate.map((combo) => ({
      combId: combo.id,
      date: dayStart,
      learningSlot: timeByPair.get(pairKey(combo.teacherId, combo.studentId)) ?? null,
      attendance: AttendanceStatus.ABSENT,
    })),
    skipDuplicates: true,
  });

  return { skipped: false as const, created: result.count, date: dayStart };
}

/** Mark yesterday's missing reports as ABSENT. */
export async function markYesterdayAbsentees() {
  const yesterday = getYesterdayUtc();
  try {
    const summary = await markAbsentForDate(yesterday);
    if (summary.skipped) {
      console.log(
        `[absent-cron] ${yesterday.toISOString().slice(0, 10)} skipped (${summary.skipped})`
      );
    } else {
      console.log(
        `[absent-cron] ${yesterday.toISOString().slice(0, 10)} marked ${summary.created} student(s) absent`
      );
    }
    return summary;
  } catch (error) {
    console.error("[absent-cron] failed to mark yesterday's absentees:", error);
    return { skipped: false as const, created: 0, date: yesterday };
  }
}

/**
 * Schedule the absent-filler to run once a day at 01:00.
 *
 * The schedule fires at 01:00 in CRON_TIMEZONE (UTC by default). Keep this in
 * UTC unless you also move the report date keys, otherwise "yesterday" could
 * drift a day relative to the stored PRESENT reports.
 */
export function startAbsentCron() {
  const timezone = process.env.CRON_TIMEZONE || "UTC";
  cron.schedule("0 1 * * *", () => markYesterdayAbsentees(), { timezone });
  console.log(`[absent-cron] scheduled daily at 01:00 (${timezone})`);
}
