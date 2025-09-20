"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export async function registerRoomAttendance(roomId: string) {
  try {
    const student = await isAuthorized("student");
    const attendance = await prisma.roomAttendance.create({
      data: { userId: student.id, roomId },
      select: { user: { select: { id: true, startDate: true } } },
    });

    if (!attendance.user.startDate) {
      await prisma.user.update({
        where: { id: attendance.user.id },
        data: { startDate: new Date() },
      });
    }

    return { status: true, message: "successfully register attendance" };
  } catch {
    return { status: false, message: "failed to register attendance" };
  }
}

export async function getRooms() {
  const student = await isAuthorized("student");

  const data = await prisma.room
    .findMany({
      where: { studentId: student.id },
      select: {
        id: true,
        teacher: {
          select: {
            firstName: true,
            fatherName: true,
            lastName: true,
            gender: true,
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

export async function getStudentController() {
  const student = await isAuthorized("student");
  const data = await prisma.user.findFirst({
    where: { id: student.id },
    select: { controller: { select: { id: true, phoneNumber: true } } },
  });

  return data?.controller;
}
