"use client";

import { useState } from "react";
import { Bell, BellRing, RefreshCw, ShieldAlert } from "lucide-react";
import { Button, Modal, ModalContent, ModalBody } from "../ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import usePushNotification from "@/hooks/usePushNotification";

/**
 * A full blocking modal shown until the user enables browser push
 * notifications on this device. It cannot be dismissed — the app stays behind
 * it until a subscription exists — and closes itself once subscribed.
 */
export default function PushSubscribeBanner() {
  const isAm = useAmharic();
  const {
    ready,
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    recheck,
  } = usePushNotification();
  const [rechecking, setRechecking] = useState(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  // Nothing to block on until we know the state, and never lock out a browser
  // that simply can't do push (old iOS Safari, etc.).
  if (!ready || !supported || subscribed) return null;

  const denied = permission === "denied";

  const handleRecheck = async () => {
    setRechecking(true);
    try {
      await recheck();
    } finally {
      setRechecking(false);
    }
  };

  return (
    <Modal
      isOpen
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled
      placement="center"
      backdrop="blur"
      size="2xl"
      classNames={{
        backdrop: "bg-black/70 backdrop-blur-md",
        wrapper: "z-[9999]",
        base: "z-[9999] mx-4",
      }}
    >
      <ModalContent>
        <ModalBody className="items-center gap-5 px-6 py-10 text-center sm:px-10">
          <span
            className={`flex size-24 items-center justify-center rounded-full ${
              denied
                ? "bg-danger-100 text-danger"
                : "bg-primary-100 text-primary"
            }`}
          >
            {denied ? (
              <ShieldAlert className="size-12" />
            ) : (
              <BellRing className="size-12" />
            )}
          </span>

          <h2 className="text-2xl font-bold text-default-800 sm:text-3xl">
            {denied
              ? t("ማሳወቂያዎች ተከልክለዋል", "Notifications are blocked")
              : t("ማሳወቂያ ያንቁ", "Turn on notifications")}
          </h2>

          <p className="max-w-lg text-sm leading-relaxed text-default-600 sm:text-base">
            {denied
              ? t(
                  "ለመቀጠል ማሳወቂያዎችን መፍቀድ አለብዎት። በአሳሽዎ የአድራሻ ሳጥን ላይ ያለውን የመቆለፊያ ምልክት ይጫኑ፣ ከዚያም ማሳወቂያዎችን ወደ «ፍቀድ» ይቀይሩ እና እንደገና ያረጋግጡ።",
                  "You must allow notifications to continue. Tap the lock icon in your browser's address bar, switch Notifications to \"Allow\", then check again."
                )
              : t(
                  "ስለ ክፍል ሊንኮች፣ ማስታወቂያዎችና ክፍያዎች ወዲያውኑ እንዲያውቁ ማሳወቂያ ማንቃት ያስፈልጋል። ከመቀጠልዎ በፊት እባክዎ ያንቁ።",
                  "You need notifications on to get class links, announcements and payment updates the moment they arrive. Please enable them before you continue."
                )}
          </p>

          {denied ? (
            <Button
              size="lg"
              color="primary"
              isLoading={rechecking}
              startContent={!rechecking && <RefreshCw className="size-5" />}
              onPress={handleRecheck}
              className="w-full max-w-xs font-semibold"
            >
              {t("እንደገና አረጋግጥ", "I've allowed it — check again")}
            </Button>
          ) : (
            <Button
              size="lg"
              color="primary"
              isLoading={loading}
              startContent={!loading && <Bell className="size-5" />}
              onPress={subscribe}
              className="w-full max-w-xs font-semibold"
            >
              {t("ማሳወቂያ አንቃ", "Enable notifications")}
            </Button>
          )}

          <p className="text-xs text-default-400">
            {t(
              "ይህ በዚህ መሳሪያ ላይ አንድ ጊዜ ብቻ ነው የሚደረገው።",
              "You only have to do this once on this device."
            )}
          </p>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
