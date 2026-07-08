"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";

type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Store (or refresh) the current user's push subscription. Keyed by endpoint so
 * re-subscribing the same device updates in place, and a device that was signed
 * in as another user gets reassigned to the current user.
 */
export async function subscribeToPush(
  subscription: BrowserSubscription,
  userAgent = ""
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: false, message: "not authenticated" };
  }

  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth256 = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth256) {
    return { status: false, message: "invalid subscription" };
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: session.user.id,
      p256dh,
      auth: auth256,
      userAgent,
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: auth256,
      userAgent,
    },
  });

  return { status: true, message: "subscribed to notifications" };
}

/** Remove a device's subscription for the current user. */
export async function unsubscribeFromPush(endpoint: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: false, message: "not authenticated" };
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return { status: true, message: "unsubscribed from notifications" };
}

/** Whether the given device endpoint is registered for the current user. */
export async function getPushSubscriptionStatus(endpoint: string) {
  const session = await auth();
  if (!session?.user?.id || !endpoint) return { subscribed: false };

  const existing = await prisma.pushSubscription.findFirst({
    where: { endpoint, userId: session.user.id },
    select: { id: true },
  });

  return { subscribed: !!existing };
}

/** Send a test notification to the current user's own devices. */
export async function sendTestPush() {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: false, message: "not authenticated" };
  }

  const result = await sendPushToUsers([session.user.id], {
    title: "Al-Anis Tilawa",
    body: "Notifications are on. You'll be alerted about announcements and class links.",
    url: "/",
  });

  return {
    status: result.sent > 0,
    message:
      result.sent > 0
        ? "test notification sent"
        : "no active subscription found on this account",
  };
}
