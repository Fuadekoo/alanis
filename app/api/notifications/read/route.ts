import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * Marks notifications as read.
 *
 * A route handler rather than a server action because the caller is the service
 * worker: when the user clicks a push notification it reports that id here, so
 * the badge is already correct by the time the app window opens.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ status: false }, { status: 401 });
  }

  let ids: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((id: unknown): id is string => typeof id === "string");
    } else if (typeof body?.id === "string") {
      ids = [body.id];
    }
  } catch {
    return NextResponse.json({ status: false }, { status: 400 });
  }

  if (ids.length === 0) return NextResponse.json({ status: true, updated: 0 });

  const now = new Date();
  const scope = { userId: session.user.id, id: { in: ids } };

  const [, read] = await prisma.$transaction([
    prisma.notification.updateMany({
      where: { ...scope, seenAt: null },
      data: { seenAt: now },
    }),
    prisma.notification.updateMany({
      where: { ...scope, readAt: null },
      data: { readAt: now },
    }),
  ]);

  return NextResponse.json({ status: true, updated: read.count });
}
