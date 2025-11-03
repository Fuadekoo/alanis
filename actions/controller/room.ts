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
  try {
    // Check if this teacher-student pair already has a room
    const existingRoom = await prisma.room.findFirst({
      where: { studentId, teacherId },
    });

    if (existingRoom) {
      // Update existing room
      await prisma.room.update({
        where: { id: existingRoom.id },
        data: { time, duration: +duration },
      });
    } else {
      // Create new room and TeacherProgress in a transaction
      await prisma.$transaction(async (tx) => {
        // Create the new room
        await tx.room.create({
          data: {
            studentId,
            teacherId,
            time,
            duration: +duration,
          },
        });

        // Check if TeacherProgress already exists
        const existingProgress = await tx.teacherProgress.findFirst({
          where: {
            studentId,
            teacherId,
            progressStatus: "open",
          },
        });

        // Create new TeacherProgress if it doesn't exist
        if (!existingProgress) {
          await tx.teacherProgress.create({
            data: {
              teacherId,
              studentId,
              learningCount: 0,
              missingCount: 0,
              totalCount: 0,
              progressStatus: "open",
              paymentStatus: "pending",
              learningSlot: time,
            },
          });
        }
      });
    }

    return { status: true, message: "successfully assign room" };
  } catch (error) {
    console.error("Error in registerRoom:", error);
    return { status: false, message: "Failed to assign room" };
  }
}

export async function deleteRoom(id: string): Promise<MutationState> {
  try {
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Get the room with teacher and student info
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

      // 2. Find the associated TeacherProgress (if exists)
      const teacherProgress = await tx.teacherProgress.findFirst({
        where: {
          teacherId: room.teacherId,
          studentId: room.studentId,
          progressStatus: "open",
        },
        include: {
          dailyReports: true,
        },
      });

      // 3. If there's an active TeacherProgress, shift it to historical data
      if (teacherProgress) {
        // Create ShiftTeacherData to preserve the history
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

        // Move all daily reports to the shifted data
        if (teacherProgress.dailyReports.length > 0) {
          await tx.dailyReport.updateMany({
            where: { teacherProgressId: teacherProgress.id },
            data: {
              shiftTeacherDataId: shiftData.id,
              teacherProgressId: null, // Remove from current progress
            },
          });
        }

        // Delete the TeacherProgress
        await tx.teacherProgress.delete({
          where: { id: teacherProgress.id },
        });
      }

      // 4. Finally, delete the room
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
