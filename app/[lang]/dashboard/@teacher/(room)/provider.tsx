"use client";

import { getRooms, uploadLink } from "@/actions/teacher/room";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
import { linkSchema } from "@/lib/zodSchema";
import React, { createContext } from "react";

const RoomContext = createContext<{
  room: UseData<typeof getRooms> & {
    registration: UseRegistration<typeof uploadLink>;
  };
} | null>(null);

export const useRoom = () => useContext(RoomContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const [data, isLoading, refresh] = useData(getRooms, () => {});
  const registration = useRegistration(uploadLink, linkSchema, (state) => {
    if (state.status) {
      refresh();
    }
  });

  return (
    <RoomContext.Provider value={{ room: { data, isLoading, registration } }}>
      {children}
    </RoomContext.Provider>
  );
}
