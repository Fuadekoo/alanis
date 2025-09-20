"use server";

import { MutationState } from "@/lib/definitions";
import { RoomSchema } from "@/lib/zodSchema";
import prisma from "@/lib/db";

export async function registerRoom({
  studentId,
  teacherId,
  time,
  duration,
}: RoomSchema): Promise<MutationState> {
  const { count } = await prisma.room.updateMany({
    where: { studentId, teacherId },
    data: { time, duration: +duration },
  });
  if (count == 0) {
    await prisma.room.create({
      data: {
        studentId,
        teacherId,
        time,
        duration: +duration,
      },
    });
  }

  return { status: true, message: "successfully assign room" };
}

export async function deleteRoom(id: string) {
  await prisma.room.delete({ where: { id } });
  return { status: true, message: "successfully delete room" };
}
