"use server";

import prisma from "@/lib/db";
import { sendRoomLinkNotification } from "@/lib/telegram";
import { isAuthorized } from "@/lib/utils";
import { LinkSchema } from "@/lib/zodSchema";

function getGreeting(gender: string) {
  if (gender === "Female") return "እህት";
  if (gender === "Male") return "ወንድም";
  return "";
}

function formatDisplayTime(time: string) {
  const timeParts = time.split(":");
  const hour = parseInt(timeParts[0], 10);
  const minute = timeParts[1] || "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

async function recordTeacherAttendance(teacherId: string, roomId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const existingAttendance = await prisma.roomAttendance.findFirst({
    where: {
      userId: teacherId,
      roomId,
      date: {
        gte: start,
        lt: end,
      },
    },
  });

  if (!existingAttendance) {
    await prisma.roomAttendance.create({
      data: { userId: teacherId, roomId },
    });
  }
}

async function notifyStudentAboutRoomLink({
  room,
  teacherId,
  link,
}: {
  room: {
    id: string;
    time: string;
    duration: number;
    student: {
      chatId: string;
      firstName: string;
      fatherName: string;
      gender: string;
    };
  };
  teacherId: string;
  link: string;
}) {
  await recordTeacherAttendance(teacherId, room.id);

  const studentChatId = room.student.chatId?.trim();
  if (!studentChatId) {
    return { ok: false, error: "Student is not connected to Telegram" };
  }

  const teacherInfo = await prisma.user.findFirst({
    where: { id: teacherId },
    select: { firstName: true, fatherName: true },
  });

  return sendRoomLinkNotification({
    chatId: studentChatId,
    link,
    studentName: `${room.student.firstName} ${room.student.fatherName}`.trim(),
    teacherName: teacherInfo
      ? `${teacherInfo.firstName} ${teacherInfo.fatherName}`.trim()
      : "",
    greeting: getGreeting(room.student.gender),
    displayTime: formatDisplayTime(room.time),
    duration: room.duration,
  });
}

function buildTelegramResultMessage(
  savedMessage: string,
  telegramResult: { ok: boolean; error?: string }
) {
  if (telegramResult.ok) {
    return { status: true, message: savedMessage };
  }

  return {
    status: true,
    message: `${savedMessage}, but Telegram notification failed: ${
      telegramResult.error ?? "unknown error"
    }`,
  };
}

export async function uploadLink({ id, link }: LinkSchema) {
  const teacher = await isAuthorized("teacher");
  const trimmedLink = link.trim();

  const room = await prisma.room.update({
    where: { id, teacherId: teacher.id },
    data: { link: trimmedLink },
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

  const telegramResult = await notifyStudentAboutRoomLink({
    room,
    teacherId: teacher.id,
    link: trimmedLink,
  });

  return buildTelegramResultMessage(
    "link successfully saved and sent to student",
    telegramResult
  );
}

export async function generateZoomLink(id: string) {
  const teacher = await isAuthorized("teacher");

  const zoomAttach = await prisma.zoomAttach.findUnique({
    where: { userId: teacher.id },
  });

  if (!zoomAttach || !zoomAttach.accessToken) {
    return {
      status: false,
      message: "Please connect your Zoom account in your profile first.",
    };
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

  let accessToken = zoomAttach.accessToken;
  const isExpired =
    zoomAttach.tokenExpiresAt && new Date() >= zoomAttach.tokenExpiresAt;

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
      return {
        status: false,
        message: "Zoom session expired. Please reconnect your account.",
      };
    }
  }

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
        type: 1,
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

  const updatedRoom = await prisma.room.update({
    where: { id },
    data: { link: meetingLink },
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

  const telegramResult = await notifyStudentAboutRoomLink({
    room: updatedRoom,
    teacherId: teacher.id,
    link: meetingLink,
  });

  const result = buildTelegramResultMessage(
    "Zoom link generated and sent to student",
    telegramResult
  );

  return { ...result, link: meetingLink };
}

export async function getRoom() {}

export async function getRooms() {
  const teacher = await isAuthorized("teacher");

  const zoomAttach = await prisma.zoomAttach.findUnique({
    where: { userId: teacher.id },
  });

  const isZoomConnected = !!(zoomAttach && zoomAttach.accessToken);

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

  return { data, isZoomConnected };
}

export async function getActiveTeachingStats() {
  const teacher = await isAuthorized("teacher");

  const reports = await prisma.teacherDailyReport.findMany({
    where: {
      salaryId: null,
      combination: {
        teacherId: teacher.id,
      },
    },
    select: {
      attendance: true,
    },
  });

  const totalLearningCount = reports.filter(
    (report) => report.attendance !== "ABSENT"
  ).length;

  const totalMissingCount = reports.filter(
    (report) => report.attendance === "ABSENT"
  ).length;

  return {
    totalTeachingDate: totalLearningCount,
    missingDate: totalMissingCount,
  };
}
