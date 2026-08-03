"use server";

import { startOfToday } from "@/lib/calendarDay";
import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function getControllerAnnouncement() {
  const controller = await isAuthorized("controller");
  // `lastDate` is the last day the announcement should show, so it stays live
  // for the whole of that day. Comparing against `new Date()` expired it at
  // midnight and the chosen last day never actually worked.
  const liveToday = [
    { lastDate: { gte: startOfToday() } },
    { lastDate: null },
  ];

  const [broadcastData, specificData] = await Promise.all([
    prisma.controllerAnnouncementData.findMany({
      where: {
        OR: liveToday,
        announcementController: { none: {} },
      },
      select: { id: true, text: true, date: true },
      orderBy: { date: "desc" },
    }),
    prisma.controllerAnnouncementData.findMany({
      where: {
        OR: liveToday,
        announcementController: { some: { controllerId: controller.id } },
      },
      select: { id: true, text: true, date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const seen = new Set<string>();
  return [...broadcastData, ...specificData].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
