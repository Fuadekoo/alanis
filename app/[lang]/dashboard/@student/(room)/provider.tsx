"use client";

import { getStudentController } from "@/actions/student/room";
import { getRooms, registerRoomAttendance } from "@/actions/student/room";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import { addToast } from "@heroui/react";
// import { useRouter } from "next/navigation";
import React, { createContext, useTransition } from "react";

const RoomContext = createContext<{
  controller:
    | {
        id: string;
        phoneNumber: string;
      }
    | null
    | undefined;
  room: UseData<typeof getRooms> & {
    action: (link: string, id: string) => Promise<void>;
    actionLoading: boolean;
    refresh: () => void;
  };
} | null>(null);

export const useRoom = () => useContext(RoomContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const [actionLoading, startTransition] = useTransition();
  // const router = useRouter();
  const [controller] = useData(getStudentController, () => []);
  const [data, isLoading, refresh] = useData(getRooms, () => {});

  return (
    <RoomContext.Provider
      value={{
        controller: controller,
        room: {
          data,
          isLoading,
          action: async (link, id) => {
            startTransition(async () => {
              const result = await registerRoomAttendance(id);
              if (!result.status) {
                addToast({
                  title: "Error",
                  description: result.message || "failed to register attendance",
                  color: "danger",
                });
                return;
              }

              window.open(link, "_blank", "noopener,noreferrer");
            });
          },
          actionLoading,
          refresh,
        },
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
