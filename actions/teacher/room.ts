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

export async function getActiveTeachingStats() {
  const teacher = await isAuthorized("teacher");

  // Get TeacherProgress with pending payment status
  const teacherProgress = await prisma.teacherProgress.findMany({
    where: {
      teacherId: teacher.id,
      paymentStatus: "pending",
    },
    select: {
      learningCount: true,
      missingCount: true,
    },
  });

  // Get ShiftTeacherData with pending payment status
  const shiftTeacherData = await prisma.shiftTeacherData.findMany({
    where: {
      teacherId: teacher.id,
      paymentStatus: "pending",
    },
    select: {
      learningCount: true,
      missingCount: true,
    },
  });

  // Sum up all counts
  const totalLearningCount =
    teacherProgress.reduce((sum, item) => sum + item.learningCount, 0) +
    shiftTeacherData.reduce((sum, item) => sum + item.learningCount, 0);

  const totalMissingCount =
    teacherProgress.reduce((sum, item) => sum + item.missingCount, 0) +
    shiftTeacherData.reduce((sum, item) => sum + item.missingCount, 0);

  return {
    totalTeachingDate: totalLearningCount,
    missingDate: totalMissingCount,
  };
}