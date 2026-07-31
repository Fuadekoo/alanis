"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

const INBOX_LIMIT = 50;

const listSelect = {
  id: true,
  title: true,
  body: true,
  url: true,
  icon: true,
  createdAt: true,
  readAt: true,
} as const;

export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  url: string;
  icon: string | null;
  createdAt: Date;
  readAt: Date | null;
};

/**
 * Hand over every notification this user has not been shown yet — the ones
 * raised while they were offline, or whose push never arrived.
 *
 * The claim is atomic: `seenAt` is stamped by the same statement that reads the
 * rows, so two tabs opening at once can never both announce the same item.
 * Being handed over is *not* being read — these stay unread in the inbox until
 * the user actually opens them.
 */
export async function pullPendingNotifications(): Promise<InboxNotification[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const rows = await prisma.notification.updateManyAndReturn({
      where: { userId: session.user.id, seenAt: null },
      data: { seenAt: new Date() },
      select: listSelect,
    });

    return rows
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-INBOX_LIMIT);
  } catch (error) {
    console.error("[notifications] failed to pull pending:", error);
    return [];
  }
}

/** Recent notifications for the bell, newest first, plus the unread count. */
export async function getInboxNotifications(): Promise<{
  notifications: InboxNotification[];
  unreadCount: number;
}> {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 };

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: INBOX_LIMIT,
        select: listSelect,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, readAt: null },
      }),
    ]);

    return { notifications, unreadCount };
  } catch (error) {
    console.error("[notifications] failed to load inbox:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark notifications as read. Pass ids to read specific ones, or nothing to
 * clear the whole inbox. Scoped to the caller, and only ever touches rows that
 * are still unread.
 */
export async function markNotificationsRead(ids?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { status: false, updated: 0 };

  if (ids && ids.length === 0) return { status: true, updated: 0 };

  try {
    const now = new Date();
    const scope = {
      userId: session.user.id,
      ...(ids ? { id: { in: ids } } : {}),
    };

    const [, read] = await prisma.$transaction([
      // A notification opened straight from the inbox may never have been
      // announced; stamp it seen too so it is not replayed as "missed" later.
      prisma.notification.updateMany({
        where: { ...scope, seenAt: null },
        data: { seenAt: now },
      }),
      prisma.notification.updateMany({
        where: { ...scope, readAt: null },
        data: { readAt: now },
      }),
    ]);

    return { status: true, updated: read.count };
  } catch (error) {
    console.error("[notifications] failed to mark read:", error);
    return { status: false, updated: 0 };
  }
}
