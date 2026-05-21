"use server";

import { MutationState } from "@/lib/definitions";
import { RoomSchema } from "@/lib/zodSchema";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  closeTeacherAssignmentHistory,
  ensureOpenTeacherAssignmentHistory,
  ensureOpenControllerAssignmentHistory,
} from "@/lib/assignmentHistory";
import { Prisma, TeacherStudentStatus } from "@prisma/client";

type Tx = Prisma.TransactionClient;

async function requireRoomActor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!["manager", "controller"].includes(session.user.role)) {
    throw new Error("You do not have permission to assign rooms");
  }

  return {
    id: session.user.id,
    role: session.user.role,
  };
}

async function ensureActiveTeacherStudent(
  tx: Tx,
  {
    studentId,
    teacherId,
  }: {
    studentId: string;
    teacherId: string;
  }
) {
  await tx.teacherStudent.upsert({
    where: {
      teacherId_studentId: {
        teacherId,
        studentId,
      },
    },
    update: {
      active: true,
      status: TeacherStudentStatus.ACTIVE,
    },
    create: {
      teacherId,
      studentId,
      active: true,
      status: TeacherStudentStatus.ACTIVE,
    },
  });
}

async function deactivateTeacherStudent(
  tx: Tx,
  {
    teacherId,
    studentId,
  }: {
    teacherId: string;
    studentId: string;
  }
) {
  await tx.teacherStudent.updateMany({
    where: {
      teacherId,
      studentId,
    },
    data: {
      active: false,
      status: TeacherStudentStatus.INACTIVE,
    },
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
    const actor = await requireRoomActor();
    const parsedDuration = +duration;

    await prisma.$transaction(async (tx) => {
      const student = await tx.user.findUnique({
        where: { id: studentId },
        select: { id: true, controllerId: true },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      if (
        actor.role === "controller" &&
        student.controllerId &&
        student.controllerId !== actor.id
      ) {
        throw new Error("You can only assign rooms for your own students");
      }

      if (actor.role === "controller" && !student.controllerId) {
        await tx.user.update({
          where: { id: studentId },
          data: {
            controllerId: actor.id,
          },
        });

        await ensureOpenControllerAssignmentHistory(tx, {
          studentId,
          controllerId: actor.id,
        });
      }

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
          await ensureActiveTeacherStudent(tx, {
            studentId,
            teacherId,
          });
          return;
        }

        await closeTeacherAssignmentHistory(tx, {
          studentId: roomById.studentId,
          teacherId: roomById.teacherId,
        });
        await deactivateTeacherStudent(tx, {
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
        await ensureActiveTeacherStudent(tx, {
          studentId,
          teacherId,
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
      await ensureActiveTeacherStudent(tx, {
        studentId,
        teacherId,
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
      await deactivateTeacherStudent(tx, {
        teacherId: room.teacherId,
        studentId: room.studentId,
      });

      await tx.room.delete({
        where: { id },
      });
    });

    return {
      status: true,
      message: "successfully delete room and archive teacher assignment",
    };
  } catch (error) {
    console.error("Error in deleteRoom:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Failed to delete room",
    };
  }
}
