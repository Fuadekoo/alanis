"use server";

import prisma from "@/lib/db";
import { AnnouncementSchema } from "@/lib/zodSchema";

export async function registerAnnouncement({
  id,
  text,
  lastDate,
  forUser,
}: AnnouncementSchema) {
  if (id) {
    await prisma.announcement.update({
      where: { id },
      data: { text, lastDate },
    });

    await prisma.announcementStudent.deleteMany({
      where: { announcementId: id },
    });

    await prisma.announcementStudent.createMany({
      data: forUser.map((studentId) => ({ studentId, announcementId: id })),
    });
  } else {
    const ids = await prisma.user
      .findMany({
        where: {
          role: "student",
          ...(forUser.length > 0 ? { id: { in: [] } } : {}),
        },
        select: { id: true, chatId: true },
      })
      .then(
        async (res) =>
          await Promise.all(
            res.map(async ({ id, chatId }) => {
              if (chatId) {
                try {
                  await global.bot.api.sendMessage(chatId, text);
                } catch {}
              }
              return { studentId: id };
            })
          )
      );
    await prisma.announcement.create({
      data: {
        text,
        lastDate,
        announcementStudent: {
          create: ids,
        },
      },
    });
  }
  return { status: true, message: "successfully register announcement" };
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
  return { status: true, message: "successfully delete announcement" };
}

export async function getAnnouncements() {
  const data = await prisma.announcement
    .findMany({
      //   where: {},
      include: {
        announcementStudent: {
          select: {
            student: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })
    .then((res) =>
      res.map(({ announcementStudent, ...rest }) => ({
        ...rest,
        forUser: announcementStudent.map(({ student }) => ({
          id: student.id,
          name: `${student.firstName} ${student.fatherName} ${student.lastName}`,
        })),
      }))
    );

  return data;
}
