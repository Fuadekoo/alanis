"use client";

import { getRooms, uploadLink } from "@/actions/teacher/room";
import { useContext } from "@/hooks/useContext";
import useData from "@/hooks/useData";
import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
import { linkSchema } from "@/lib/zodSchema";
import React, { createContext } from "react";

const RoomContext = createContext<{
  room: {
    data: Awaited<ReturnType<typeof getRooms>>["data"] | null;
    isZoomConnected: boolean;
    isLoading: boolean;
    registration: UseRegistration<typeof uploadLink>;
    refresh: () => void;
  };
} | null>(null);

export const useRoom = () => useContext(RoomContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const [roomData, isLoading, refresh] = useData(getRooms, () => {});

  const data = roomData?.data || null;
  const isZoomConnected = roomData?.isZoomConnected || false;

  const registration = useRegistration(uploadLink, linkSchema, (state) => {
    if (state.status) {
      refresh();
    }
  });

  return (
    <RoomContext.Provider
      value={{
        room: { data, isZoomConnected, isLoading, registration, refresh },
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
