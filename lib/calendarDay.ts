/**
 * Calendar-day helpers.
 *
 * Al Anis runs on Ethiopian local time (UTC+3, no DST). A day the manager picks
 * in a calendar — an announcement's last day, an attendance day — is a
 * *calendar day*, not an instant, so it must never be re-interpreted through
 * whatever timezone the browser or the server happens to be in.
 *
 * Getting that wrong is what made the date pickers select the wrong day: a
 * picked day was written with `toDate(getLocalTimeZone())` (local midnight, an
 * instant that lands on the previous day once stored as UTC) and read back with
 * `toISOString()` (the UTC day of that instant), so the value shifted by one
 * day on every round trip.
 *
 * Everything here is plain arithmetic with no dependencies, so the same
 * functions are safe in client components and in server actions.
 */

import { CalendarDate, type DateValue } from "@internationalized/date";

export const ETHIOPIA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

export type CalendarDay = { year: number; month: number; day: number };

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toDateOrNull(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The Ethiopian calendar day an instant falls on. */
export function toCalendarDay(date: Date): CalendarDay {
  const shifted = new Date(date.getTime() + ETHIOPIA_UTC_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * The instant an Ethiopian calendar day begins.
 *
 * This is what we store for a picked day, so a stored value always means "this
 * calendar day" and never drifts — reading it back with `toCalendarDay` returns
 * exactly the day that was picked, in any timezone.
 */
export function startOfCalendarDay(date: Date): Date {
  const { year, month, day } = toCalendarDay(date);
  return new Date(Date.UTC(year, month - 1, day) - ETHIOPIA_UTC_OFFSET_MS);
}

/** The instant the Ethiopian calendar day *after* the given one begins. */
export function endOfCalendarDay(date: Date): Date {
  return new Date(startOfCalendarDay(date).getTime() + 24 * 60 * 60 * 1000);
}

/** Start of today, Ethiopian time. */
export function startOfToday(): Date {
  return startOfCalendarDay(new Date());
}

/** Start of tomorrow, Ethiopian time — the exclusive end of today. */
export function endOfToday(): Date {
  return endOfCalendarDay(new Date());
}

/**
 * `YYYY-MM-DD` for a HeroUI `DatePicker` (feed it to `parseDate`).
 * Returns `null` for a missing or unparseable value.
 */
export function toCalendarDayString(
  value: Date | string | number | null | undefined
): string | null {
  const date = toDateOrNull(value);
  if (!date) return null;

  const { year, month, day } = toCalendarDay(date);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
}

/**
 * Stored value → the `CalendarDate` a `DatePicker` should show.
 *
 * Pair with `fromDatePicker` for the write side; together they make the picker
 * round-trip a day exactly, whatever timezone the viewer is in.
 */
export function toDatePickerValue(
  value: Date | string | number | null | undefined
): CalendarDate | null {
  const date = toDateOrNull(value);
  if (!date) return null;

  const { year, month, day } = toCalendarDay(date);
  return new CalendarDate(year, month, day);
}

/**
 * `DatePicker` selection → the value to store.
 *
 * `toDate("UTC")` pins the picked day itself without involving the viewer's
 * timezone (and works for any calendar system the picker might display);
 * `startOfCalendarDay` then anchors it to the start of that Ethiopian day.
 */
export function fromDatePicker(value: DateValue | null | undefined) {
  if (!value) return undefined;
  return startOfCalendarDay(value.toDate("UTC"));
}

/**
 * Human-readable day, e.g. `Aug 03, 2026`.
 *
 * Always the Ethiopian day, so a date reads the same on a phone in Addis, a
 * laptop set to UTC and a server-rendered page.
 */
export function formatCalendarDay(
  value: Date | string | number | null | undefined
): string {
  const date = toDateOrNull(value);
  if (!date) return "";

  const { year, month, day } = toCalendarDay(date);
  return `${MONTH_NAMES[month - 1]} ${String(day).padStart(2, "0")}, ${year}`;
}
