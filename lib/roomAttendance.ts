import "server-only";

import prisma from "@/lib/db";

/**
 * Attendance days follow Ethiopian local time (UTC+3), not the server clock, so
 * a class joined at 23:30 in Addis is never filed under the next day.
 */
export function getTodayAttendanceRange() {
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

export type RoomAttendanceResult = {
  status: boolean;
  message: string;
  /** True when the row already existed for today; the join is still allowed. */
  alreadyRegistered?: boolean;
};

/**
 * Save a student's attendance for one room, once per day.
 *
 * This is the single source of truth for "the student joined the class". Both
 * entry points use it — the dashboard button (`registerRoomAttendance`) and the
 * Telegram / push "Join Class" link (`/api/room/join`) — so a student who joins
 * from the bot is recorded exactly like one who joins from the website.
 */
export async function recordStudentRoomAttendance({
  studentId,
  roomId,
}: {
  studentId: string;
  roomId: string;
}): Promise<RoomAttendanceResult> {
  try {
    const studentData = await prisma.user.findUnique({
      where: { id: studentId },
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
      where: { id: roomId, studentId },
      select: { id: true },
    });

    if (!room) {
      return { status: false, message: "room not found for this student" };
    }

    const { start, end } = getTodayAttendanceRange();

    const existingAttendance = await prisma.roomAttendance.findFirst({
      where: {
        userId: studentId,
        roomId: room.id,
        date: { gte: start, lt: end },
      },
      select: { id: true },
    });

    if (existingAttendance) {
      return {
        status: true,
        message: "Attendance already registered",
        alreadyRegistered: true,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.roomAttendance.create({
        data: { userId: studentId, roomId: room.id },
      });

      if (!studentData.startDate) {
        await tx.user.update({
          where: { id: studentId },
          data: { startDate: new Date() },
        });
      }
    });

    return { status: true, message: "successfully register attendance" };
  } catch (error) {
    console.error("recordStudentRoomAttendance failed:", error);
    return { status: false, message: "failed to register attendance" };
  }
}

/** Has this student already been marked present in this room today? */
export async function hasStudentRoomAttendanceToday({
  studentId,
  roomId,
}: {
  studentId: string;
  roomId: string;
}) {
  const { start, end } = getTodayAttendanceRange();

  const attendance = await prisma.roomAttendance.findFirst({
    where: {
      userId: studentId,
      roomId,
      date: { gte: start, lt: end },
    },
    select: { id: true },
  });

  return !!attendance;
}
