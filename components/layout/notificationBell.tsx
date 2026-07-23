"use client";

import { useState } from "react";
import { addToast } from "@heroui/react";
import { Bell, BellRing } from "lucide-react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import usePushNotification from "@/hooks/usePushNotification";

export default function NotificationBell() {
  const isAm = useAmharic();
  const { ready, supported, permission, subscribed, loading, subscribe } =
    usePushNotification();
  const [isOpen, setIsOpen] = useState(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  if (!supported) return null;

  const handlePress = () => {
    // Already subscribed — nothing to do, just let the user know.
    if (subscribed) {
      addToast({
        title: t("ነቅቷል", "Subscribed"),
        description: t(
          "ማሳወቂያዎች በዚህ መሳሪያ ላይ ነቅተዋል።",
          "Notifications are already enabled on this device."
        ),
        color: "success",
      });
      return;
    }
    setIsOpen(true);
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) setIsOpen(false);
  };

  return (
    <>
      <Button
        isIconOnly
        variant="shadow"
        className="bg-default-50/50 text-lg"
        isDisabled={!ready}
        onPress={handlePress}
        aria-label={t("ማሳወቂያዎች", "Notifications")}
      >
        {subscribed ? (
          <BellRing className="size-4 text-success-600" />
        ) : (
          <span className="relative">
            <Bell className="size-4" />
            {ready && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-danger" />
            )}
          </span>
        )}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </span>
                {t("የማሳወቂያ ደወል", "Push Notifications")}
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-default-600">
                  {t(
                    "ስለ ማስታወቂያዎችና ስለ ክፍል ሊንኮች በአሳሽዎ ማሳወቂያ ያግኙ።",
                    "Get notified about announcements and class links right in your browser."
                  )}
                </p>
                {permission === "denied" && (
                  <p className="text-sm text-danger-600">
                    {t(
                      "ማሳወቂያዎች ተከልክለዋል። ከአሳሽዎ ቅንብር ውስጥ ይፍቀዱ።",
                      "Notifications are blocked. Enable them from your browser's site settings."
                    )}
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("በኋላ", "Later")}
                </Button>
                <Button
                  color="primary"
                  isLoading={loading}
                  isDisabled={permission === "denied"}
                  startContent={!loading && <Bell className="size-4" />}
                  onPress={handleSubscribe}
                >
                  {t("ማሳወቂያ አንቃ", "Enable notifications")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
