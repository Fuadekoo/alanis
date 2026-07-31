"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ScrollShadow,
  Chip,
} from "../ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import usePushNotification from "@/hooks/usePushNotification";
import useNotificationInbox from "@/hooks/useNotificationInbox";

export default function NotificationBell() {
  const isAm = useAmharic();
  const router = useRouter();
  const { supported, permission, subscribed, loading, subscribe } =
    usePushNotification();
  const { notifications, unreadCount, loading: inboxLoading, markRead } =
    useNotificationInbox();
  const [isOpen, setIsOpen] = useState(false);

  const t = (am: string, en: string) => (isAm ? am : en);

  // Opening an item is what marks it read — never the mere arrival of a push.
  const handleOpen = async (item: (typeof notifications)[number]) => {
    if (!item.readAt) await markRead([item.id]);
    if (!item.url || item.url === "/") return;

    setIsOpen(false);
    if (item.url.startsWith("/")) router.push(item.url);
    else window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Button
        isIconOnly
        variant="shadow"
        className="bg-default-50/50 text-lg"
        onPress={() => setIsOpen(true)}
        aria-label={t("ማሳወቂያዎች", "Notifications")}
      >
        <span className="relative">
          {unreadCount > 0 ? (
            <BellRing className="size-4 text-primary" />
          ) : (
            <Bell className="size-4" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="center"
        scrollBehavior="inside"
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </span>
                {t("ማሳወቂያዎች", "Notifications")}
                {unreadCount > 0 && (
                  <Chip size="sm" color="danger" variant="flat">
                    {unreadCount}
                  </Chip>
                )}
              </ModalHeader>

              <ModalBody className="gap-3 px-3">
                {/* Push is the fast path; the list below works with or without
                    it, so this is a prompt rather than a blocker. */}
                {supported && !subscribed && (
                  <div className="flex flex-col gap-2 rounded-large bg-primary-50 p-3 text-sm text-default-600">
                    <p>
                      {t(
                        "ስለ ማስታወቂያዎችና ስለ ክፍል ሊንኮች ወዲያውኑ ለማወቅ ማሳወቂያ ያንቁ።",
                        "Enable push to hear about announcements and class links the moment they arrive."
                      )}
                    </p>
                    {permission === "denied" ? (
                      <p className="text-danger-600">
                        {t(
                          "ማሳወቂያዎች ተከልክለዋል። ከአሳሽዎ ቅንብር ውስጥ ይፍቀዱ።",
                          "Notifications are blocked. Enable them from your browser's site settings."
                        )}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        color="primary"
                        isLoading={loading}
                        startContent={!loading && <Bell className="size-4" />}
                        onPress={subscribe}
                        className="self-start"
                      >
                        {t("ማሳወቂያ አንቃ", "Enable notifications")}
                      </Button>
                    )}
                  </div>
                )}

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-default-400">
                    <Inbox className="size-10" />
                    <p className="text-sm">
                      {inboxLoading
                        ? t("በመጫን ላይ...", "Loading...")
                        : t("ማሳወቂያ የለም።", "No notifications yet.")}
                    </p>
                  </div>
                ) : (
                  <ScrollShadow className="max-h-[55vh]">
                    <ul className="flex flex-col gap-1">
                      {notifications.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleOpen(item)}
                            className={`flex w-full gap-3 rounded-large p-3 text-left transition-colors hover:bg-default-100 ${
                              item.readAt ? "opacity-60" : "bg-primary-50/60"
                            }`}
                          >
                            <span
                              className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                item.readAt ? "bg-transparent" : "bg-primary"
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-default-800">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block whitespace-pre-line text-sm text-default-600">
                                {item.body}
                              </span>
                              <span className="mt-1 block text-xs text-default-400">
                                {formatDistanceToNow(new Date(item.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </ScrollShadow>
                )}
              </ModalBody>

              <ModalFooter>
                {unreadCount > 0 && (
                  <Button
                    variant="flat"
                    startContent={<CheckCheck className="size-4" />}
                    onPress={() => markRead()}
                  >
                    {t("ሁሉንም አንብቤያለሁ", "Mark all read")}
                  </Button>
                )}
                <Button color="primary" onPress={onClose}>
                  {t("ዝጋ", "Close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
