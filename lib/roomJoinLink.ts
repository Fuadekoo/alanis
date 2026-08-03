import "server-only";

import { sign, verify } from "jsonwebtoken";

/**
 * A Telegram inline button can only carry a plain URL, and a raw Zoom URL never
 * touches this server — which is exactly why joining from the bot used to leave
 * no attendance behind. Instead we hand Telegram (and the browser push) a
 * signed link back to `/api/room/join`, which saves the attendance and then
 * redirects on to the real class link. One tap for the student, same DB write
 * as the dashboard button.
 */

const TOKEN_PURPOSE = "room-join";

/**
 * Long enough to cover a class that starts late or a student who opens the
 * message hours later, short enough that a stale message can never be used to
 * fake attendance on a following day.
 */
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

export type RoomJoinTokenPayload = {
  roomId: string;
  studentId: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.trim() ? secret : null;
}

function getBaseUrl() {
  const base = process.env.AUTH_URL?.trim();
  if (!base) return null;
  return base.replace(/\/+$/, "");
}

export function createRoomJoinToken({
  roomId,
  studentId,
}: RoomJoinTokenPayload): string | null {
  const secret = getSecret();
  if (!secret) {
    console.error("[roomJoinLink] AUTH_SECRET is not configured");
    return null;
  }

  return sign({ p: TOKEN_PURPOSE, r: roomId, s: studentId }, secret, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyRoomJoinToken(
  token: string
): RoomJoinTokenPayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  try {
    const payload = verify(token, secret);
    if (typeof payload === "string") return null;

    const { p, r, s } = payload as { p?: string; r?: string; s?: string };
    if (p !== TOKEN_PURPOSE || !r || !s) return null;

    return { roomId: r, studentId: s };
  } catch (error) {
    // Expired or tampered token — the caller falls back to a friendly page.
    console.warn(
      "[roomJoinLink] rejected join token:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Build the tracked join URL for a room.
 *
 * Returns `null` when the environment can't produce one (missing `AUTH_URL` or
 * `AUTH_SECRET`); callers fall back to the raw class link so a misconfigured
 * deployment still delivers a working button — it just won't record attendance.
 */
export function buildRoomJoinUrl({
  roomId,
  studentId,
}: RoomJoinTokenPayload): string | null {
  const base = getBaseUrl();
  if (!base) {
    console.error("[roomJoinLink] AUTH_URL is not configured");
    return null;
  }

  const token = createRoomJoinToken({ roomId, studentId });
  if (!token) return null;

  return `${base}/api/room/join?t=${encodeURIComponent(token)}`;
}
