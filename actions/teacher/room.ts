"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";
import { LinkSchema } from "@/lib/zodSchema";

export async function uploadLink({ id, link }: LinkSchema) {
  const teacher = await isAuthorized("teacher");
  const room = await prisma.room.update({
    where: { id },
    data: { link },
    select: {
      id: true,
      time: true,
      duration: true,
      student: {
        select: {
          chatId: true,
          firstName: true,
          fatherName: true,
          gender: true,
        },
      },
    },
  });
  await prisma.roomAttendance.create({
    data: { userId: teacher.id, roomId: room.id },
  });

  // Send Telegram notification with inline button to the student
  const studentChatId = room.student.chatId;
  if (studentChatId) {
    try {
      const greeting =
        room.student.gender === "Female"
          ? "እህት"
          : room.student.gender === "Male"
          ? "ወንድም"
          : "";
  // Get teacher info for notification
      const teacherInfo = await prisma.user.findFirst({
        where: { id: teacher.id },
        select: { firstName: true, fatherName: true },
      });
      const studentName = `${room.student.firstName} ${room.student.fatherName}`;
      const teacherName = teacherInfo
        ? `${teacherInfo.firstName} ${teacherInfo.fatherName}`
        : "";

      // Convert 24h time string to 12h format for display
      const timeParts = room.time.split(":");
      const hour = parseInt(timeParts[0]);
      const minute = timeParts[1] || "00";
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      const displayTime = `${displayHour}:${minute} ${period}`;

      const message =
        `📚 *የክፍል ሊንክ ደርሶዎታል!*\n\n` +
        `${greeting} *${studentName}*\n\n` +
        `👨‍🏫 መምህር: *${teacherName}*\n` +
        `🕐 ሰዓት: *${displayTime}*\n` +
        `⏱ ቆይታ: *${room.duration} ደቂቃ*\n\n` +
        `ከታች ያለውን ቁልፍ በመጫን ወደ ክፍልዎ ይግቡ 👇`;

      await global.bot.api.sendMessage(studentChatId, message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📖 ወደ ክፍል ይግቡ / Join Class",
                url: link,
              },
            ],
          ],
        },
      });
    } catch (error) {
      console.error("Failed to send Telegram notification to student:", error);
    }
  }

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