"use client";

import { getOnline, getUserList } from "@/actions/common/chat";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import { role as Role } from "@prisma/client";
import { createContext, useState } from "react";

const ChatContext = createContext<{
  user: UseData<typeof getUserList> & {
    role: Role;
    setRole: (role: Role) => void;
    selected: string;
    onSelected: (role: string) => void;
  };
  online: Set<string>;
  setOnline: React.Dispatch<React.SetStateAction<Set<string>>>;
  update: string;
  setUpdate: (value: string) => void;
  isSide: boolean;
  setIsSide: (value: boolean) => void;
} | null>(null);

export const useChat = () => useContext(ChatContext);
export function Provider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("student");
  const [selected, onSelected] = useState("");
  const [data, isLoading] = useData(
    getUserList,
    (data) => {
      const value = data.find((v) => v.id == selected)?.id ?? data[0]?.id;
      if (value) onSelected(value);
    },
    role
  );
  const [online, setOnline] = useState<Set<string>>(new Set([]));
  const [update, setUpdate] = useState("");
  const [isSide, setIsSide] = useState(true);

  useData(
    getOnline,
    (data) => {
      setOnline(new Set(data));
    },
    role
  );

  return (
    <ChatContext.Provider
      value={{
        user: { role, setRole, data, isLoading, selected, onSelected },
        online,
        setOnline,
        update,
        setUpdate,
        isSide,
        setIsSide,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
