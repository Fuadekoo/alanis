"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/heroui";
import { addToast } from "@heroui/react";
import { Bell, BellOff, BellRing, Send } from "lucide-react";
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

export default function PushNotificationCard() {
  const isAm = useAmharic();
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      setReady(true);
      return;
    }

    setPermission(Notification.permission);

    (async () => {
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
    })();
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      addToast({
        title: t("ስህተት", "Error"),
        description: t(
          "የማሳወቂያ ቁልፍ አልተዋቀረም",
          "Push notification key is not configured."
        ),
        color: "danger",
      });
      return;
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
        return;
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
      } else {
        addToast({
          title: t("ስህተት", "Error"),
          description: res.message,
          color: "danger",
        });
      }
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
    } finally {
      setLoading(false);
    }
  }, [isAm]);

  const handleUnsubscribe = useCallback(async () => {
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

  const handleTest = useCallback(async () => {
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

  return (
    <div className="rounded-xl border border-default-200 bg-default-50/60 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {subscribed ? (
            <BellRing className="size-5" />
          ) : (
            <Bell className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">
            {t("የማሳወቂያ ደወል", "Push Notifications")}
          </p>
          <p className="text-sm text-default-500">
            {t(
              "ስለ ማስታወቂያዎችና ስለ ክፍል ሊንኮች በአሳሽዎ ማሳወቂያ ያግኙ።",
              "Get notified about announcements and class links right in your browser."
            )}
          </p>

          {!ready ? (
            <p className="mt-3 text-sm text-default-400">
              {t("በመጫን ላይ...", "Loading...")}
            </p>
          ) : !supported ? (
            <p className="mt-3 text-sm text-warning-600">
              {t(
                "ይህ አሳሽ የማሳወቂያ ደወልን አይደግፍም።",
                "This browser doesn't support push notifications."
              )}
            </p>
          ) : permission === "denied" ? (
            <p className="mt-3 text-sm text-danger-600">
              {t(
                "ማሳወቂያዎች ተከልክለዋል። ከአሳሽዎ ቅንብር ውስጥ ይፍቀዱ።",
                "Notifications are blocked. Enable them from your browser's site settings."
              )}
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {subscribed ? (
                <>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    isLoading={loading}
                    startContent={<BellOff className="size-4" />}
                    onPress={handleUnsubscribe}
                  >
                    {t("አጥፋ", "Turn off")}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    isLoading={loading}
                    startContent={<Send className="size-4" />}
                    onPress={handleTest}
                  >
                    {t("ሙከራ ላክ", "Send test")}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  isLoading={loading}
                  startContent={<Bell className="size-4" />}
                  onPress={handleSubscribe}
                >
                  {t("ማሳወቂያ አንቃ", "Enable notifications")}
                </Button>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  subscribed
                    ? "bg-success-50 text-success-600 dark:bg-success-500/10"
                    : "bg-default-100 text-default-500"
                }`}
              >
                {subscribed
                  ? t("ነቅቷል", "Subscribed")
                  : t("አልነቃም", "Not subscribed")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
