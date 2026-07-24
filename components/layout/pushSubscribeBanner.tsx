"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "../ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import usePushNotification from "@/hooks/usePushNotification";

/**
 * A slim top banner that nudges the user to enable browser push notifications
 * when they haven't subscribed yet on this device. It disappears automatically
 * once subscribed, and can be dismissed for the current session.
 */
export default function PushSubscribeBanner() {
  const isAm = useAmharic();
  const { ready, supported, permission, subscribed, loading, subscribe } =
    usePushNotification();
  const [dismissed, setDismissed] = useState(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  // Only nudge when we know the state and there's something to do.
  if (!ready || !supported || subscribed || dismissed) return null;

  const denied = permission === "denied";

  return (
    <div className="px-4 pt-3 lg:px-10">
      <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50/80 px-3 py-2.5 shadow-sm">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-default-700">
            {t("ማሳወቂያ ያንቁ", "Turn on notifications")}
          </p>
          <p className="text-[11px] leading-tight text-default-500">
            {denied
              ? t(
                  "ማሳወቂያዎች ተከልክለዋል። ከአሳሽዎ ቅንብር ውስጥ ይፍቀዱ።",
                  "Notifications are blocked. Enable them from your browser's site settings."
                )
              : t(
                  "ስለ ክፍል ሊንኮችና ማስታወቂያዎች ወዲያውኑ ይወቁ።",
                  "Get class links and announcements the moment they arrive."
                )}
          </p>
        </div>
        {!denied && (
          <Button
            size="sm"
            color="primary"
            isLoading={loading}
            startContent={!loading && <Bell className="size-4" />}
            onPress={subscribe}
            className="shrink-0"
          >
            {t("አንቃ", "Enable")}
          </Button>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => setDismissed(true)}
          aria-label={t("ዝጋ", "Dismiss")}
          className="shrink-0"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
