"use server";

import prisma from "@/lib/db";
import {
  hasStudentRoomAttendanceToday,
  recordStudentRoomAttendance,
} from "@/lib/roomAttendance";
import { isAuthorized } from "@/lib/utils";

export async function registerRoomAttendance(roomId: string) {
  try {
    const student = await isAuthorized("student");
    // Same helper the Telegram join link uses, so both routes save identically.
    return await recordStudentRoomAttendance({ studentId: student.id, roomId });
  } catch (error) {
    console.error("registerRoomAttendance failed:", error);
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
export async function verifyRoomAttendance(roomId: string) {
  try {
    const student = await isAuthorized("student");

    // Also true when the student joined from Telegram: the bot's button now
    // records attendance through the same table, so the dashboard shows the
    // room as already joined instead of asking again.
    if (await hasStudentRoomAttendanceToday({ studentId: student.id, roomId })) {
      return { status: true, message: "Attendance verified" };
    }

    return { status: false, message: "Attendance not found" };
  } catch (error) {
    console.error("verifyRoomAttendance failed:", error);
    return { status: false, message: "Verification failed" };
  }
}
