"use server";

import { startOfToday } from "@/lib/calendarDay";
import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function getTeacherAnnouncement() {
  const teacher = await isAuthorized("teacher");
  // `lastDate` is the last day the announcement should show, so it stays live
  // for the whole of that day. Comparing against `new Date()` expired it at
  // midnight and the chosen last day never actually worked.
  const liveToday = [
    { lastDate: { gte: startOfToday() } },
    { lastDate: null },
  ];

  const specificData = await prisma.teacherAnnouncementData.findMany({
    where: {
      OR: liveToday,
      announcementTeacher: { some: { teacherId: teacher.id } },
    },
    select: { text: true, date: true },
  });
  const data = await prisma.teacherAnnouncementData.findMany({
    where: {
      OR: liveToday,
      announcementTeacher: { none: {} },
    },
    select: { text: true, date: true },
  });

  return [...data, ...specificData];
}

