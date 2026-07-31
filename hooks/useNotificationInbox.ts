"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addToast } from "@heroui/react";
import useAmharic from "@/hooks/useAmharic";
import {
  getInboxNotifications,
  markNotificationsRead,
  pullPendingNotifications,
  type InboxNotification,
} from "@/actions/common/notification";

/** How many missed items get their own toast before we collapse the rest. */
const MAX_TOASTS = 3;

/**
 * The reliable half of the notification system.
 *
 * Web push is best-effort — a device that was asleep, offline or whose push
 * expired simply never sees it. So whenever the app becomes usable (mount, tab
 * focus, reconnect, or a push landing in an open tab) we ask the server for
 * everything it has not handed over yet and announce it here instead.
 *
 * The server claims those rows atomically as it returns them, so nothing is
 * announced twice; they stay *unread* until the user opens them.
 */
export default function useNotificationInbox() {
  const isAm = useAmharic();
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // Guards against a focus event landing on top of an in-flight sync.
  const syncing = useRef(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  const refresh = useCallback(async () => {
    const result = await getInboxNotifications();
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    return result;
  }, []);

  const sync = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const pending = await pullPendingNotifications();

      pending.slice(0, MAX_TOASTS).forEach((item) => {
        addToast({
          title: item.title,
          description: item.body,
          color: "primary",
          timeout: 8000,
        });
      });

      if (pending.length > MAX_TOASTS) {
        const rest = pending.length - MAX_TOASTS;
        addToast({
          title: t("ያመለጡ ማሳወቂያዎች", "Missed notifications"),
          description: t(
            `ሌሎች ${rest} ማሳወቂያዎች አሉዎት። ለማየት የደወሉን ምልክት ይጫኑ።`,
            `You have ${rest} more notification${rest === 1 ? "" : "s"}. Tap the bell to read them.`
          ),
          color: "primary",
          timeout: 8000,
        });
      }

      await refresh();
    } catch (error) {
      console.error("[notifications] sync failed", error);
    } finally {
      syncing.current = false;
      setLoading(false);
    }
  }, [refresh, isAm]);

  useEffect(() => {
    sync();

    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    // Back from a dead connection — this is exactly the "came back online" case.
    window.addEventListener("online", sync);

    // A push that arrived while this tab was open: refresh the badge without
    // waiting for the user to switch away and back.
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "notification-received") sync();
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", sync);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [sync]);

  /** Mark specific notifications read; omit ids to clear the whole inbox. */
  const markRead = useCallback(
    async (ids?: string[]) => {
      const now = new Date();
      // Optimistic — the badge should drop the moment the user opens the item.
      setNotifications((current) =>
        current.map((item) =>
          !item.readAt && (!ids || ids.includes(item.id))
            ? { ...item, readAt: now }
            : item
        )
      );
      setUnreadCount((count) =>
        ids ? Math.max(0, count - ids.length) : 0
      );

      await markNotificationsRead(ids);
      await refresh();
    },
    [refresh]
  );

  return { notifications, unreadCount, loading, markRead, refresh, sync };
}
