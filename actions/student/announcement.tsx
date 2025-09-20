"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function getAnnouncement() {
  const student = await isAuthorized("student");
  const specificData = await prisma.announcement.findMany({
    where: {
      OR: [{ lastDate: { gte: new Date() } }, { lastDate: null }],
      announcementStudent: { some: { studentId: student.id } },
    },
    select: { text: true, date: true },
  });
  const data = await prisma.announcement.findMany({
    where: {
      OR: [{ lastDate: { gte: new Date() } }, { lastDate: null }],
      announcementStudent: { none: { announcementId: { not: "" } } },
    },
    select: { text: true, date: true },
  });

  console.log("AK >>>>>>>>>>>>>>>> ", specificData);

  return [...data, ...specificData];
}
