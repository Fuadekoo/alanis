import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import useData from "./useData";
import useMutation from "./useMutation";
import { deleteChat } from "@/actions/common/chat";

export default function useSocket(
  getChat: (
    id: string
  ) => Promise<
    { id: string; message: string; createdAt: Date; self: boolean }[]
  >,
  id: string,
  api: string,
  setOnline: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const [chat, setChat] = useState<
    { id: string; message: string; createdAt: Date; self: boolean }[]
  >([]);
  useData(
    getChat,
    (data) => {
      setChat(data);
    },
    id ?? "none"
  );
  const { data } = useSession();
  const [socket, setSocket] = useState<Socket>();
  const emitDelete = useCallback(
    async (chatId: string) => {
      console.log("DELETE >> ", socket?.connected);
      if (socket?.connected) {
        socket.emit("delete", id, chatId);
      }
    },
    [id, socket]
  );
  const [onDelete, deleting] = useMutation(deleteChat, (state) => {
    if (state.status) {
      setChat((prev) => prev.filter((v) => v.id !== state.id));
      emitDelete(state.id);
    }
  });

  useEffect(() => {
    const socket = io(api, {
      auth: { id: data?.user?.id || "" },
    });
    setSocket(socket);
    socket.on("error", () => {});
    socket.on("user:+", (id: string) => {
      setOnline((prev) => new Set([...prev, id]));
    });
    socket.on("user:-", (id: string) => {
      setOnline((prev) => new Set([...prev].filter((v) => v !== id)));
    });
    socket.on(
      "message",
      (data: {
        id: string;
        message: string;
        createdAt: Date;
        self: boolean;
      }) => {
        setChat((prev) => [...prev, data]);
      }
    );
    socket.on("update", ({ id, message }: { id: string; message: string }) => {
      setChat((prev) => prev.map((v) => (v.id == id ? { ...v, message } : v)));
    });
    socket.on("delete", (id: string) => {
      setChat((prev) => prev.filter((v) => v.id !== id));
    });
    socket.on("id", (tempId: string, id: string) => {
      setChat((prev) => prev.map((v) => (v.id == tempId ? { ...v, id } : v)));
    });
    return () => {
      socket.off();
      socket.disconnect();
      socket.close();
    };
  }, []);

  return {
    chat,
    setChat,
    socket,
    onDelete: (id: string) => {
      if (id.startsWith("--")) {
        setChat((prev) => prev.filter((v) => v.id !== id));
      } else {
        onDelete(id);
      }
    },
    deleting,
  };
}
