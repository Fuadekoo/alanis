"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  ScrollShadow,
  Textarea,
} from "@/components/ui/heroui";
import { CheckCheck, List, Loader2, Pen, Send, Trash, X } from "lucide-react";
import { useChat } from "./provider";
import useSocket from "@/hooks/useSocket";
import { getChat } from "@/actions/common/chat";
import { useState } from "react";
import { cn } from "@heroui/react";
import { useParams } from "next/navigation";

export function Chat() {
  const {
    setOnline,
    user: { data, selected },
    update,
    setUpdate,
    setIsSide,
  } = useChat();

  const { chat, setChat, socket, onDelete, deleting } = useSocket(
    getChat,
    selected,
    process.env.AUTH_URL!,

    setOnline
  );
  const [message, setMessage] = useState("");
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="bg-default-50/50 rounded-xl overflow-hidden grid grid-rows-[auto_1fr_auto] md:grid-rows-[1fr_auto]">
      <div className="md:hidden p-2 bg-default-50/50 flex gap-2">
        <p className="flex-1 content-center capitalize">
          {((value) =>
            value
              ? `${value.firstName} ${value.fatherName} ${value.lastName}`
              : "")(data?.find((v) => v.id == selected))}
        </p>
        <Button isIconOnly onPress={setIsSide.bind(undefined, true)}>
          <List className="size-4" />
        </Button>
      </div>
      <ScrollShadow size={100} className="p-2 pb-40 flex gap-4 flex-col  ">
        {chat.map(({ id, message, createdAt, self }, i) => (
          <Dropdown key={i + ""}>
            <DropdownTrigger>
              <div
                className={cn(
                  "max-w-[70%] w-fit  ",
                  self ? "place-self-end" : ""
                )}
              >
                <p className="p-2 bg-default-50 rounded-xl">{message}</p>
                <p
                  className={cn(
                    "p-2 text-xs text-default-400 flex gap-1",
                    self ? "text-end" : "text-start"
                  )}
                >
                  {!id.startsWith("--") && <CheckCheck className="size-4" />}
                  <span className="">
                    {new Date(createdAt.toString()).toString().slice(4, 15)}
                  </span>
                </p>
              </div>
            </DropdownTrigger>
            <DropdownMenu variant="flat" closeOnSelect={false}>
              <DropdownItem
                key={"edit"}
                color="primary"
                startContent={<Pen className="size-4" />}
                onPress={setUpdate.bind(undefined, id)}
              >
                {lang == "am" ? "ያስተካክሉ" : lang == "or" ? "Sirreessi" : "Edit"}
              </DropdownItem>
              <DropdownItem
                key={"delete"}
                color="danger"
                startContent={<Trash className="size-4" />}
                onPress={onDelete.bind(undefined, id)}
                endContent={
                  deleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : undefined
                }
              >
                {lang == "am" ? "ይሰርዙ" : lang == "or" ? "Haqi" : "Delete"}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ))}
      </ScrollShadow>
      <div className="">
        {update && (
          <p className="p-2 bg-primary/20 flex gap-2 items-center ">
            <Pen className="size-4 shrink-0" />
            <span className="flex-1">
              {chat.find((v) => v.id == update)?.message ?? ""}
            </span>
            <span onClick={setUpdate.bind(undefined, "")} className="">
              <X className="size-4 shrink-0" />
            </span>
          </p>
        )}
        <Textarea
          className=""
          classNames={{ inputWrapper: "bg-default-50/50 rounded-none" }}
          placeholder={lang == "am" ? "እዚህ ይፃፉ ..." : lang == "or" ? "Asitti barreessaa ..." : "type here ..."}
          value={message}
          onValueChange={setMessage}
          endContent={
            <Button
              isIconOnly
              color="primary"
              variant={message ? "solid" : "flat"}
              disabled={!message}
              onPress={() => {
                if (socket?.connected) {
                  if (update) {
                    setChat((prev) =>
                      prev.map((v) => (v.id == update ? { ...v, message } : v))
                    );
                    socket.emit("update", {
                      id: update,
                      message,
                    });
                    setUpdate("");
                  } else {
                    const tempId = "--" + Date.now().toString();
                    setChat((prev) => [
                      ...prev,
                      {
                        id: tempId,
                        createdAt: new Date(),
                        message,
                        self: true,
                      },
                    ]);
                    socket.emit("message", {
                      tempId,
                      toId: selected,
                      message,
                    });
                  }
                  setMessage("");
                }
              }}
            >
              <Send className="size-4 rotate-45" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
