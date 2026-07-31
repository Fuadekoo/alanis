import "server-only";

import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import {
  DEFAULT_PUSH_TTL_SECONDS,
  sendPushPerUser,
  type PushPayload,
} from "@/lib/push";

export type NotifyInput = {
  /** Recipients. Nullish and duplicate ids are dropped. */
  userIds: Array<string | null | undefined>;
  title: string;
  body: string;
  /** Where the app navigates when the notification is opened. */
  url?: string;
  icon?: string;
  /**
   * Stable id of the source event, e.g. `announcement:<id>`. Two calls carrying
   * the same key never produce a second row for the same user — retries, double
   * submits and re-runs are all safe. Omit only for genuinely one-off messages.
   */
  dedupeKey?: string;
  /**
   * How long the push service should hold the message for an offline device.
   * A hint only: the row survives regardless of what the TTL does.
   */
  ttlSeconds?: number;
};

/**
 * Raise a notification for a set of users.
 *
 * Order matters: the row is written to Postgres **first**, so a push that never
 * lands (device offline, subscription dead, VAPID misconfigured, TTL expired)
 * costs nothing — the notification simply stays pending and is handed over the
 * next time the user opens the app.
 *
 * Never throws; delivery must not take down the caller's own work.
 */
export async function notifyUsers(
  input: NotifyInput
): Promise<{ created: number; pushed: number }> {
  const userIds = [...new Set(input.userIds.filter((id): id is string => !!id))];
  if (userIds.length === 0) return { created: 0, pushed: 0 };

  try {
    // Ids are generated here rather than by the database so that, after
    // `skipDuplicates` has dropped the ones we already sent, reading our own ids
    // back tells us exactly which rows are new — and therefore which users still
    // need a push.
    const rows = userIds.map((userId) => ({
      id: randomUUID(),
      userId,
      title: input.title,
      body: input.body,
      url: input.url ?? "/",
      icon: input.icon,
      dedupeKey: input.dedupeKey,
    }));

    await prisma.notification.createMany({ data: rows, skipDuplicates: true });

    const created = await prisma.notification.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      select: { id: true, userId: true },
    });
    if (created.length === 0) return { created: 0, pushed: 0 };

    const delivered = await sendPushPerUser(
      created.map(({ id, userId }) => ({
        userId,
        payload: {
          title: input.title,
          body: input.body,
          url: input.url,
          icon: input.icon,
          // Tagging by row id lets the OS collapse a repeat of the same
          // notification instead of showing it twice.
          tag: id,
          notificationId: id,
        } satisfies PushPayload,
      })),
      input.ttlSeconds ?? DEFAULT_PUSH_TTL_SECONDS
    );

    if (delivered.size > 0) {
      // Records the attempt, not a read: the user still has to open it.
      await prisma.notification.updateMany({
        where: {
          id: { in: created.filter((c) => delivered.has(c.userId)).map((c) => c.id) },
        },
        data: { pushedAt: new Date() },
      });
    }

    return { created: created.length, pushed: delivered.size };
  } catch (error) {
    console.error("[notifications] failed to raise notification:", error);
    return { created: 0, pushed: 0 };
  }
}
