"use server";

import { startOfToday } from "@/lib/calendarDay";
import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function getAnnouncement() {
  const student = await isAuthorized("student");
  // `lastDate` is the last day the announcement should show, so it stays live
  // for the whole of that day. Comparing against `new Date()` expired it at
  // midnight and the chosen last day never actually worked.
  const liveToday = [
    { lastDate: { gte: startOfToday() } },
    { lastDate: null },
  ];

  const specificData = await prisma.announcement.findMany({
    where: {
      OR: liveToday,
      announcementStudent: { some: { studentId: student.id } },
    },
    select: { text: true, date: true },
  });
  const data = await prisma.announcement.findMany({
    where: {
      OR: liveToday,
      announcementStudent: { none: { announcementId: { not: "" } } },
    },
    select: { text: true, date: true },
  });

  return [...data, ...specificData];
}
