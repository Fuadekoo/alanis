"use server";

import prisma from "@/lib/db";
import { TeacherAnnouncementSchema } from "@/lib/zodSchema";

export async function registerTeacherAnnouncement({
  id,
  text,
  lastDate,
  forUser,
}: TeacherAnnouncementSchema) {
  if (id) {
    await prisma.teacherAnnouncementData.update({
      where: { id },
      data: { text, lastDate },
    });

    await prisma.announcementTeacher.deleteMany({
      where: { teacherAnnouncementDataId: id },
    });

    await prisma.announcementTeacher.createMany({
      data: forUser.map((teacherId) => ({
        teacherId,
        teacherAnnouncementDataId: id,
      })),
    });
  } else {
    const ids = await prisma.user
      .findMany({
        where: {
          role: "teacher",
          ...(forUser.length > 0 ? { id: { in: forUser } } : {}),
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
              return { teacherId: id };
            })
          )
      );
    await prisma.teacherAnnouncementData.create({
      data: {
        text,
        lastDate,
        announcementTeacher: {
          create: ids.map(({ teacherId }) => ({
            teacherId,
          })),
        },
      },
    });
  }
  return { status: true, message: "successfully register teacher announcement" };
}

export async function deleteTeacherAnnouncement(id: string) {
  // First delete all related announcementTeacher records
  await prisma.announcementTeacher.deleteMany({
    where: { teacherAnnouncementDataId: id },
  });
  
  // Then delete the main teacherAnnouncementData record
  await prisma.teacherAnnouncementData.delete({ where: { id } });
  return { status: true, message: "successfully delete teacher announcement" };
}

export async function getTeacherAnnouncements() {
  const data = await prisma.teacherAnnouncementData
    .findMany({
      include: {
        announcementTeacher: {
          select: {
            teacher: {
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
      res.map(({ announcementTeacher, ...rest }) => ({
        ...rest,
        forUser: announcementTeacher.map(({ teacher }) => ({
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`,
        })),
      }))
    );

  return data;
}

