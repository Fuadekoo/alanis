"use client";

import { getStudentController } from "@/actions/student/room";
import { getRooms, registerRoomAttendance } from "@/actions/student/room";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
// import { useRouter } from "next/navigation";
import React, { createContext, useState } from "react";

const RoomContext = createContext<{
  controller:
    | {
        id: string;
        phoneNumber: string;
      }
    | null
    | undefined;
  room: UseData<typeof getRooms> & {
    action: (link: string, id: string) => void;
    actionLoading: boolean;
    refresh: () => void;
  };
} | null>(null);

export const useRoom = () => useContext(RoomContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const [link, setLink] = useState("");
  // const router = useRouter();
  const [controller] = useData(getStudentController, () => []);
  const [data, isLoading, refresh] = useData(getRooms, () => {});
  const [action, actionLoading] = useMutation(registerRoomAttendance, () => {
    if (link) {
      // router.push(link);
    }
  });

  return (
    <RoomContext.Provider
      value={{
        controller: controller,
        room: {
          data,
          isLoading,
          action: (link, id) => {
            setLink(link);
            action(id);
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
