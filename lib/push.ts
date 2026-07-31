import "server-only";

import webpush from "web-push";
import prisma from "@/lib/db";

let configured = false;

/**
 * Lazily wire up the VAPID credentials. Returns false (and logs a warning) when
 * the keys are missing so callers can no-op instead of throwing — a missing key
 * should never break an announcement or a class link from being saved/sent.
 */
function configure() {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@alanistilawa.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys are not configured; skipping web push.");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Where the browser navigates when the notification is clicked. */
  url?: string;
  icon?: string;
  /**
   * Collapse key. The service worker passes it to `showNotification`, so the OS
   * replaces an existing notification with the same tag instead of stacking a
   * second copy of the same event.
   */
  tag?: string;
  /** Row id in the `notification` table, echoed back when the user clicks. */
  notificationId?: string;
};

/**
 * How long a push service should hold the message for a device that is offline.
 * Only a delivery hint — the `notification` table, not the TTL, decides what the
 * user still owes a read, so an expired push is never a lost notification.
 */
export const DEFAULT_PUSH_TTL_SECONDS = 60 * 60 * 24 * 3;

type Subscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function encode(payload: PushPayload) {
  // Keep the encrypted payload comfortably under the 4KB web-push limit.
  const body =
    payload.body.length > 500
      ? `${payload.body.slice(0, 497)}...`
      : payload.body;

  return JSON.stringify({
    title: payload.title,
    body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/al-anis.png",
    tag: payload.tag,
    notificationId: payload.notificationId,
  });
}

/**
 * Push one message to one device. Returns whether the push service accepted it,
 * and reports a dead subscription so the caller can prune it.
 */
async function deliver(
  sub: Subscription,
  message: string,
  ttl: number
): Promise<{ ok: boolean; stale: boolean }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      message,
      { TTL: ttl }
    );
    return { ok: true, stale: false };
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired / was revoked — drop it so we stop retrying.
      return { ok: false, stale: true };
    }
    console.error(
      "[push] send error:",
      statusCode,
      (error as { body?: string; message?: string })?.body ??
        (error as Error)?.message
    );
    return { ok: false, stale: false };
  }
}

async function pruneStale(endpoints: string[]) {
  if (endpoints.length === 0) return;
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: { in: endpoints } },
  });
}

/**
 * Best-effort web-push delivery to every device of the given users.
 *
 * - De-duplicates user ids.
 * - Never throws: delivery is fire-and-forget relative to the caller's own work.
 * - Prunes subscriptions the push service reports as gone (404/410).
 *
 * Prefer `notifyUsers` in `lib/notifications.ts` for anything the user must not
 * miss — this call alone leaves no record if the device is offline.
 */
export async function sendPushToUsers(
  userIds: Array<string | null | undefined>,
  payload: PushPayload,
  ttlSeconds: number = DEFAULT_PUSH_TTL_SECONDS
): Promise<{ sent: number; failed: number }> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return { sent: 0, failed: 0 };
  if (!configure()) return { sent: 0, failed: 0 };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: uniqueIds } },
  });
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const message = encode(payload);
  const staleEndpoints: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const { ok, stale } = await deliver(sub, message, ttlSeconds);
      if (ok) sent += 1;
      else {
        failed += 1;
        if (stale) staleEndpoints.push(sub.endpoint);
      }
    })
  );

  await pruneStale(staleEndpoints);

  return { sent, failed };
}

/**
 * Push a *different* payload to each user — needed because every notification
 * carries its own row id and tag.
 *
 * Returns the ids of users for whom at least one device accepted the push. A
 * user missing from that set is simply one whose notification stays pending in
 * the inbox until they next open the app.
 */
export async function sendPushPerUser(
  items: Array<{ userId: string; payload: PushPayload }>,
  ttlSeconds: number = DEFAULT_PUSH_TTL_SECONDS
): Promise<Set<string>> {
  const delivered = new Set<string>();
  if (items.length === 0 || !configure()) return delivered;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: [...new Set(items.map((i) => i.userId))] } },
  });
  if (subscriptions.length === 0) return delivered;

  const byUser = new Map<string, Subscription[]>();
  for (const sub of subscriptions) {
    const list = byUser.get(sub.userId) ?? [];
    list.push(sub);
    byUser.set(sub.userId, list);
  }

  const staleEndpoints: string[] = [];

  await Promise.all(
    items.map(async ({ userId, payload }) => {
      const subs = byUser.get(userId);
      if (!subs?.length) return;

      const message = encode(payload);
      await Promise.all(
        subs.map(async (sub) => {
          const { ok, stale } = await deliver(sub, message, ttlSeconds);
          if (ok) delivered.add(userId);
          else if (stale) staleEndpoints.push(sub.endpoint);
        })
      );
    })
  );

  await pruneStale(staleEndpoints);

  return delivered;
}
