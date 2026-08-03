import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { recordStudentRoomAttendance } from "@/lib/roomAttendance";
import { verifyRoomJoinToken } from "@/lib/roomJoinLink";

/**
 * Tracked "Join Class" endpoint used by the Telegram button and the browser
 * push notification.
 *
 * A raw Zoom URL in a Telegram button never reaches this app, so joining from
 * the bot left no attendance behind while joining from the dashboard did. This
 * route closes that gap: it saves the attendance with the exact same helper the
 * dashboard uses, then redirects the student on to the class.
 *
 * The link is signed (see `lib/roomJoinLink.ts`) so it cannot be forged or
 * replayed on another day, and it is deliberately unauthenticated — the student
 * taps it from Telegram, where there is no web session.
 */

export const dynamic = "force-dynamic";

function isValidHttpUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A self-contained page for the cases where we cannot send the student onward
 * (expired link, no link uploaded yet, inactive account). Telegram opens links
 * in its own in-app browser, so this has to read well on a small screen with no
 * app shell around it.
 */
function renderPage({
  emoji,
  amharic,
  english,
  status = 200,
}: {
  emoji: string;
  amharic: string;
  english: string;
  status?: number;
}) {
  const dashboardUrl = `${(process.env.AUTH_URL ?? "").replace(/\/+$/, "")}/am/dashboard`;

  const html = `<!doctype html>
<html lang="am">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Al Anis Quran Center</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f172a;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        padding: 24px;
      }
      .card {
        max-width: 420px;
        width: 100%;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 18px;
        padding: 28px 24px;
        text-align: center;
      }
      .emoji { font-size: 44px; }
      .am { font-size: 18px; font-weight: 700; margin: 14px 0 6px; line-height: 1.6; }
      .en { font-size: 14px; color: #94a3b8; line-height: 1.6; }
      a.btn {
        display: inline-block;
        margin-top: 22px;
        padding: 12px 22px;
        border-radius: 12px;
        background: #22c55e;
        color: #052e16;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="emoji">${emoji}</div>
      <div class="am">${escapeHtml(amharic)}</div>
      <div class="en">${escapeHtml(english)}</div>
      ${
        isValidHttpUrl(dashboardUrl)
          ? `<a class="btn" href="${escapeHtml(dashboardUrl)}">ወደ ዳሽቦርድ / Open dashboard</a>`
          : ""
      }
    </div>
  </body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const payload = verifyRoomJoinToken(token);

  if (!payload) {
    return renderPage({
      emoji: "⌛",
      amharic: "ይህ የክፍል ሊንክ ጊዜው አልፎበታል።",
      english:
        "This class link has expired or is invalid. Please open your dashboard to join today's class.",
      status: 400,
    });
  }

  const { roomId, studentId } = payload;

  const room = await prisma.room.findFirst({
    where: { id: roomId, studentId },
    select: { id: true, link: true },
  });

  if (!room) {
    return renderPage({
      emoji: "🔍",
      amharic: "ክፍሉ አልተገኘም።",
      english: "This class could not be found for your account.",
      status: 404,
    });
  }

  // Save first, redirect second: the student's attendance must not depend on
  // whether the class link is still usable.
  const attendance = await recordStudentRoomAttendance({ studentId, roomId });

  if (!attendance.status && attendance.message.includes("inactive")) {
    return renderPage({
      emoji: "🚫",
      amharic: "መለያዎ ስራ ላይ አይደለም። እባክዎን ተቆጣጣሪዎን ያነጋግሩ።",
      english:
        "Your account is inactive, so you cannot join the class. Please contact your controller.",
      status: 403,
    });
  }

  if (!attendance.status) {
    // Attendance could not be written (DB trouble). Never trap the student
    // outside the class over it — log it and let them in anyway.
    console.error(
      `[room/join] attendance not saved for student ${studentId} room ${roomId}: ${attendance.message}`
    );
  }

  const link = room.link?.trim() ?? "";
  if (!isValidHttpUrl(link)) {
    return renderPage({
      emoji: "📭",
      amharic: "መምህርዎ ገና ሊንክ አልላኩም። ትንሽ ቆይተው ይሞክሩ።",
      english:
        "Your teacher has not uploaded the class link yet. Your attendance is saved — please try again shortly.",
    });
  }

  return NextResponse.redirect(link, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
