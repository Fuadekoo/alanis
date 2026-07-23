"use client";

import { Button } from "@/components/ui/heroui";
import { Bell, BellOff, BellRing, Send } from "lucide-react";
import useAmharic from "@/hooks/useAmharic";
import usePushNotification from "@/hooks/usePushNotification";

export default function PushNotificationCard() {
  const isAm = useAmharic();
  const {
    ready,
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTest,
  } = usePushNotification();

  const t = (am: string, en: string) => (isAm ? am : en);

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
                    onPress={unsubscribe}
                  >
                    {t("አጥፋ", "Turn off")}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    isLoading={loading}
                    startContent={<Send className="size-4" />}
                    onPress={sendTest}
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
                  onPress={() => subscribe()}
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
