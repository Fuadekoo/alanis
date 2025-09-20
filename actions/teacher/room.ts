"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";
import { LinkSchema } from "@/lib/zodSchema";

export async function uploadLink({ id, link }: LinkSchema) {
  const teacher = await isAuthorized("teacher");
  const room = await prisma.room.update({ where: { id }, data: { link } });
  await prisma.roomAttendance.create({
    data: { userId: teacher.id, roomId: room.id },
  });
  return { status: true, message: "link successfully saved" };
}

export async function getRoom() {}

export async function getRooms() {
  const teacher = await isAuthorized("teacher");

  const data = await prisma.room
    .findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        student: {
          select: {
            firstName: true,
            fatherName: true,
            lastName: true,
            controller: { select: { phoneNumber: true } },
          },
        },
        time: true,
        link: true,
        updated: true,
      },
    })
    .then((res) => {
      return res
        .map((v) => ({
          ...v,
          link: Date.now() - v.updated.getTime() < 40 * 60 * 1000 ? v.link : "",
        }))
        .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0));
    });

  return data;
}
