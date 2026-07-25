"use client";

import { useCallback, useEffect, useState } from "react";
import { addToast } from "@heroui/react";
import useAmharic from "@/hooks/useAmharic";
import {
  getPushSubscriptionStatus,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/actions/common/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Whether an existing subscription was created with the current VAPID key. */
function keyMatches(existing: ArrayBuffer | null, expected: Uint8Array) {
  if (!existing) return false;
  const actual = new Uint8Array(existing);
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i += 1) {
    if (actual[i] !== expected[i]) return false;
  }
  return true;
}

export default function usePushNotification() {
  const isAm = useAmharic();
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  /** Re-read the browser permission and whether this device is subscribed. */
  const recheck = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      setReady(true);
      return;
    }

    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // A subscription made with a different VAPID key can't receive our
        // pushes — treat it as not subscribed so the user re-enables.
        const validKey =
          !VAPID_PUBLIC_KEY ||
          keyMatches(
            existing.options.applicationServerKey,
            urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          );
        if (validKey) {
          const status = await getPushSubscriptionStatus(existing.endpoint);
          setSubscribed(status.subscribed);
        }
      }
    } catch (error) {
      console.error("Service worker registration failed", error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    recheck();
  }, [recheck]);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      addToast({
        title: t("ስህተት", "Error"),
        description: t(
          "የማሳወቂያ ቁልፍ አልተዋቀረም",
          "Push notification key is not configured."
        ),
        color: "danger",
      });
      return false;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        addToast({
          title: t("ተከልክሏል", "Blocked"),
          description: t(
            "እባክዎ በአሳሽዎ ውስጥ ማሳወቂያዎችን ይፍቀዱ።",
            "Please allow notifications in your browser settings."
          ),
          color: "warning",
        });
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      let sub = await registration.pushManager.getSubscription();

      // Replace a subscription that was created with a different VAPID key.
      if (sub && !keyMatches(sub.options.applicationServerKey, appServerKey)) {
        try {
          await unsubscribeFromPush(sub.endpoint);
        } catch {
          // best-effort server cleanup
        }
        await sub.unsubscribe();
        sub = null;
      }

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

      const json = sub.toJSON();
      const res = await subscribeToPush(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
        },
        navigator.userAgent
      );

      if (res.status) {
        setSubscribed(true);
        addToast({
          title: t("ተነቅቷል", "Enabled"),
          description: t(
            "ማሳወቂያዎችን ማግኘት ጀምረዋል።",
            "You'll now receive notifications on this device."
          ),
          color: "success",
        });
        return true;
      }
      addToast({
        title: t("ስህተት", "Error"),
        description: res.message,
        color: "danger",
      });
      return false;
    } catch (error) {
      console.error(error);
      addToast({
        title: t("ስህተት", "Error"),
        description: t(
          "ማሳወቂያዎችን ማንቃት አልተሳካም።",
          "Failed to enable notifications."
        ),
        color: "danger",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAm]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      addToast({
        title: t("ጠፍቷል", "Disabled"),
        description: t(
          "ማሳወቂያዎች በዚህ መሳሪያ ላይ ጠፍተዋል።",
          "Notifications are turned off on this device."
        ),
        color: "default",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [isAm]);

  const sendTest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sendTestPush();
      addToast({
        title: res.status ? t("ተልኳል", "Sent") : t("ማሳሰቢያ", "Notice"),
        description: res.message,
        color: res.status ? "success" : "warning",
      });
    } finally {
      setLoading(false);
    }
  }, [isAm]);

  return {
    ready,
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTest,
    recheck,
  };
}
