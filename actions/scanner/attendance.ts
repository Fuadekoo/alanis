"use server";

import { sign } from "jsonwebtoken";

export async function getAttendanceToken(): Promise<string> {
  const token = sign(
    {
      value: process.env.ATTENDANCE_VALUE,
    },
    process.env.AUTH_SECRET!,
    {
      expiresIn: "10s",
    }
  );
  return token;
}
