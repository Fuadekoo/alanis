"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function detachZoomAccount() {
  const session = await auth();
  if (!session?.user) {
    return { status: false, message: "Authentication required" };
  }

  try {
    const record = await prisma.zoomAttach.findUnique({
      where: { userId: session.user.id },
    });
    if (!record) {
      return { status: false, message: "No zoom account to detach" };
    }

    await prisma.zoomAttach.delete({
      where: { userId: session.user.id },
    });

    return { status: true, message: "Zoom account detached successfully" };
  } catch (error) {
    console.error("detachZoomAccount error", error);
    return { status: false, message: "Failed to detach Zoom account" };
  }
}
