"use server";

import { MutationState } from "@/lib/definitions";
import { RoomSchema } from "@/lib/zodSchema";
import prisma from "@/lib/db";
import {
  closeTeacherAssignmentHistory,
  ensureOpenTeacherAssignmentHistory,
} from "@/lib/assignmentHistory";
import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

async function ensureOpenTeacherProgress(
  tx: Tx,
  {
    studentId,
    teacherId,
    learningSlot,
  }: {
    studentId: string;
    teacherId: string;
    learningSlot: string;
  }
) {
  const existingProgress = await tx.teacherProgress.findFirst({
    where: {
      studentId,
      teacherId,
      progressStatus: "open",
    },
    select: {
      id: true,
    },
  });

  if (existingProgress) {
    await tx.teacherProgress.update({
      where: { id: existingProgress.id },
      data: { learningSlot },
    });
    return;
  }

  await tx.teacherProgress.create({
    data: {
      teacherId,
      studentId,
      learningCount: 0,
      missingCount: 0,
      totalCount: 0,
      progressStatus: "open",
      paymentStatus: "pending",
      learningSlot,
    },
  });
}

async function shiftOpenTeacherProgress(
  tx: Tx,
  {
    teacherId,
    studentId,
  }: {
    teacherId: string;
    studentId: string;
  }
) {
  const teacherProgress = await tx.teacherProgress.findFirst({
    where: {
      teacherId,
      studentId,
      progressStatus: "open",
    },
    include: {
      dailyReports: true,
    },
  });

  if (!teacherProgress) return;

  const shiftData = await tx.shiftTeacherData.create({
    data: {
      teacherId: teacherProgress.teacherId,
      studentId: teacherProgress.studentId,
      learningCount: teacherProgress.learningCount,
      missingCount: teacherProgress.missingCount,
      totalCount: teacherProgress.totalCount,
      progressStatus: "closed",
      paymentStatus: teacherProgress.paymentStatus,
      learningSlot: teacherProgress.learningSlot,
      teacherSalaryId: teacherProgress.teacherSalaryId,
      originalProgressId: teacherProgress.id,
    },
  });

  if (teacherProgress.dailyReports.length > 0) {
    await tx.dailyReport.updateMany({
      where: { teacherProgressId: teacherProgress.id },
      data: {
        shiftTeacherDataId: shiftData.id,
        teacherProgressId: null,
      },
    });
  }

  await tx.teacherProgress.delete({
    where: { id: teacherProgress.id },
  });
}

export async function registerRoom({
  id,
  studentId,
  teacherId,
  time,
  duration,
}: RoomSchema): Promise<MutationState> {
  try {
    const parsedDuration = +duration;

    await prisma.$transaction(async (tx) => {
      const roomById = id
        ? await tx.room.findUnique({
            where: { id },
          })
        : null;

      if (roomById) {
        await ensureOpenTeacherAssignmentHistory(tx, {
          studentId: roomById.studentId,
          teacherId: roomById.teacherId,
          time: roomById.time,
          duration: roomById.duration,
        });

        const samePair =
          roomById.studentId === studentId && roomById.teacherId === teacherId;

        if (samePair) {
          await tx.room.update({
            where: { id: roomById.id },
            data: { time, duration: parsedDuration },
          });

          await ensureOpenTeacherAssignmentHistory(tx, {
            studentId,
            teacherId,
            time,
            duration: parsedDuration,
          });
          await ensureOpenTeacherProgress(tx, {
            studentId,
            teacherId,
            learningSlot: time,
          });
          return;
        }

        await closeTeacherAssignmentHistory(tx, {
          studentId: roomById.studentId,
          teacherId: roomById.teacherId,
        });
        await shiftOpenTeacherProgress(tx, {
          teacherId: roomById.teacherId,
          studentId: roomById.studentId,
        });

        const existingTargetRoom = await tx.room.findFirst({
          where: { studentId, teacherId },
        });

        if (existingTargetRoom) {
          await tx.room.update({
            where: { id: existingTargetRoom.id },
            data: { time, duration: parsedDuration },
          });
        } else {
          await tx.room.create({
            data: {
              studentId,
              teacherId,
              time,
              duration: parsedDuration,
            },
          });
        }

        await ensureOpenTeacherAssignmentHistory(tx, {
          studentId,
          teacherId,
          time,
          duration: parsedDuration,
        });
        await ensureOpenTeacherProgress(tx, {
          studentId,
          teacherId,
          learningSlot: time,
        });

        await tx.room.delete({
          where: { id: roomById.id },
        });
        return;
      }

      const existingRoom = await tx.room.findFirst({
        where: { studentId, teacherId },
      });

      if (existingRoom) {
        await tx.room.update({
          where: { id: existingRoom.id },
          data: { time, duration: parsedDuration },
        });
      } else {
        await tx.room.create({
          data: {
            studentId,
            teacherId,
            time,
            duration: parsedDuration,
          },
        });
      }

      await ensureOpenTeacherAssignmentHistory(tx, {
        studentId,
        teacherId,
        time,
        duration: parsedDuration,
      });
      await ensureOpenTeacherProgress(tx, {
        studentId,
        teacherId,
        learningSlot: time,
      });
    });

    return { status: true, message: "successfully assign room" };
  } catch (error) {
    console.error("Error in registerRoom:", error);
    return { status: false, message: "Failed to assign room" };
  }
}

export async function deleteRoom(id: string): Promise<MutationState> {
  try {
    await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id },
        include: {
          teacher: true,
          student: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }

      await ensureOpenTeacherAssignmentHistory(tx, {
        studentId: room.studentId,
        teacherId: room.teacherId,
        time: room.time,
        duration: room.duration,
      });
      await closeTeacherAssignmentHistory(tx, {
        studentId: room.studentId,
        teacherId: room.teacherId,
      });
      await shiftOpenTeacherProgress(tx, {
        teacherId: room.teacherId,
        studentId: room.studentId,
      });

      await tx.room.delete({
        where: { id },
      });
    });

    return {
      status: true,
      message: "successfully delete room and shift teacher data",
    };
  } catch (error) {
    console.error("Error in deleteRoom:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Failed to delete room",
    };
  }
}
