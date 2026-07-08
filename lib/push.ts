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
};

/**
 * Best-effort web-push delivery to every device of the given users.
 *
 * - De-duplicates user ids.
 * - Never throws: delivery is fire-and-forget relative to the caller's own work.
 * - Prunes subscriptions the push service reports as gone (404/410).
 */
export async function sendPushToUsers(
  userIds: Array<string | null | undefined>,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return { sent: 0, failed: 0 };
  if (!configure()) return { sent: 0, failed: 0 };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: uniqueIds } },
  });
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  // Keep the encrypted payload comfortably under the 4KB web-push limit.
  const body =
    payload.body.length > 500
      ? `${payload.body.slice(0, 497)}...`
      : payload.body;

  const message = JSON.stringify({
    title: payload.title,
    body,
    url: payload.url ?? "/",
    icon: payload.icon ?? "/al-anis.png",
  });

  // Retain for up to a day so a briefly-offline device still gets it.
  const options = { TTL: 60 * 60 * 24 } as const;

  const staleEndpoints: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message,
          options
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired / was revoked — drop it so we stop retrying.
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error(
            "[push] send error:",
            statusCode,
            (error as { body?: string; message?: string })?.body ??
              (error as Error)?.message
          );
        }
      }
    })
  );

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }

  return { sent, failed };
}
