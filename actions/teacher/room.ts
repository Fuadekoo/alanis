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

function buildZoomLink() {
  const meetingId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const pwd = Math.random().toString(36).slice(-8);
  return `https://zoom.us/j/${meetingId}?pwd=${pwd}`;
}

export async function generateZoomLink(id: string) {
  const teacher = await isAuthorized("teacher");
  
  // Find teacher's Zoom attachment
  const zoomAttach = await prisma.zoomAttach.findUnique({
    where: { userId: teacher.id },
  });

  if (!zoomAttach || !zoomAttach.accessToken) {
    return { status: false, message: "Please connect your Zoom account in your profile first." };
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      student: true,
    },
  });

  if (!room || room.teacherId !== teacher.id) {
    return { status: false, message: "Room not found or access denied" };
  }

  // Helper to refresh token if needed
  let accessToken = zoomAttach.accessToken;
  const isExpired = zoomAttach.tokenExpiresAt && new Date() >= zoomAttach.tokenExpiresAt;

  if (isExpired && zoomAttach.refreshToken) {
    try {
      const clientId = process.env.ZOOM_Client_ID;
      const clientSecret = process.env.ZOOM_Client_Secret;
      
      const tokenResponse = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: zoomAttach.refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to refresh token");
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      await prisma.zoomAttach.update({
        where: { id: zoomAttach.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });
    } catch (error) {
      console.error("Zoom token refresh error:", error);
      return { status: false, message: "Zoom session expired. Please reconnect your account." };
    }
  }

  // Create Zoom Meeting
  let meetingLink = "";
  try {
    const meetingResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: `Class with ${room.student.firstName} ${room.student.fatherName}`,
        type: 1, // Instant meeting
        duration: room.duration,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
        },
      }),
    });

    if (!meetingResponse.ok) {
      console.error("Zoom API error:", await meetingResponse.text());
      return { status: false, message: "Failed to create Zoom meeting." };
    }

    const meetingData = await meetingResponse.json();
    meetingLink = meetingData.join_url;
  } catch (error) {
    console.error("Zoom meeting creation error:", error);
    return { status: false, message: "Failed to connect to Zoom API." };
  }

  const link = meetingLink;

  const updatedRoom = await prisma.room.update({
    where: { id },
    data: { link },
    include: {
      student: true,
    },
  });

  await prisma.roomAttendance.create({
    data: { userId: teacher.id, roomId: updatedRoom.id },
  });

  // Reuse the Telegram notification flow from uploadLink
  const studentChatId = updatedRoom.student.chatId;
  if (studentChatId) {
    try {
      const greeting =
        updatedRoom.student.gender === "Female"
          ? "እህት"
          : updatedRoom.student.gender === "Male"
          ? "ወንድም"
          : "";
      const teacherInfo = await prisma.user.findFirst({
        where: { id: teacher.id },
        select: { firstName: true, fatherName: true },
      });
      const studentName = `${updatedRoom.student.firstName} ${updatedRoom.student.fatherName}`;
      const teacherName = teacherInfo
        ? `${teacherInfo.firstName} ${teacherInfo.fatherName}`
        : "";

      const timeParts = updatedRoom.time.split(":");
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
        `⏱ ቆይታ: *${updatedRoom.duration} ደቂቃ*\n\n` +
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

  return { status: true, message: "Zoom link generated and sent", link };
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