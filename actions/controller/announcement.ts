"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function getControllerAnnouncement() {
  const controller = await isAuthorized("controller");
  const [broadcastData, specificData] = await Promise.all([
    prisma.controllerAnnouncementData.findMany({
      where: {
        OR: [{ lastDate: { gte: new Date() } }, { lastDate: null }],
        announcementController: { none: {} },
      },
      select: { id: true, text: true, date: true },
      orderBy: { date: "desc" },
    }),
    prisma.controllerAnnouncementData.findMany({
      where: {
        OR: [{ lastDate: { gte: new Date() } }, { lastDate: null }],
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
