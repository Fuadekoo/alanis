"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

function getTodayAttendanceRange() {
  const ethiopiaOffsetMs = 3 * 60 * 60 * 1000;
  const ethiopiaNow = new Date(Date.now() + ethiopiaOffsetMs);
  const start = new Date(
    Date.UTC(
      ethiopiaNow.getUTCFullYear(),
      ethiopiaNow.getUTCMonth(),
      ethiopiaNow.getUTCDate()
    ) - ethiopiaOffsetMs
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export async function registerRoomAttendance(roomId: string) {
  try {
    const student = await isAuthorized("student");
    const studentData = await prisma.user.findUnique({
      where: { id: student.id },
      select: { id: true, startDate: true, status: true },
    });

    if (!studentData) {
      return { status: false, message: "student account not found" };
    }

    if (studentData.status === "inactive") {
      return {
        status: false,
        message: "inactive students are not allowed to join room",
      };
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, studentId: student.id },
      select: { id: true },
    });

    if (!room) {
      return { status: false, message: "room not found for this student" };
    }

    const { start, end } = getTodayAttendanceRange();

    const existingAttendance = await prisma.roomAttendance.findFirst({
      where: {
        userId: student.id,
        roomId: room.id,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    if (existingAttendance) {
      return { status: true, message: "Attendance already registered" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.roomAttendance.create({
        data: { userId: student.id, roomId: room.id },
      });

      if (!studentData.startDate) {
        await tx.user.update({
          where: { id: student.id },
          data: { startDate: new Date() },
        });
      }
    });

    return { status: true, message: "successfully register attendance" };
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
    const { start, end } = getTodayAttendanceRange();

    const attendance = await prisma.roomAttendance.findFirst({
      where: {
        userId: student.id,
        roomId: roomId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    if (attendance) {
      return { status: true, message: "Attendance verified" };
    }

    return { status: false, message: "Attendance not found" };
  } catch (error) {
    console.error("verifyRoomAttendance failed:", error);
    return { status: false, message: "Verification failed" };
  }
}
