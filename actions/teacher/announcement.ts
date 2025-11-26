"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function getTeacherAnnouncement() {
  const teacher = await isAuthorized("teacher");
  const specificData = await prisma.teacherAnnouncementData.findMany({
    where: {
      OR: [{ lastDate: { gte: new Date() } }, { lastDate: null }],
      announcementTeacher: { some: { teacherId: teacher.id } },
    },
    select: { text: true, date: true },
  });
  const data = await prisma.teacherAnnouncementData.findMany({
    where: {
      OR: [{ lastDate: { gte: new Date() } }, { lastDate: null }],
      announcementTeacher: { none: {} },
    },
    select: { text: true, date: true },
  });

  return [...data, ...specificData];
}

