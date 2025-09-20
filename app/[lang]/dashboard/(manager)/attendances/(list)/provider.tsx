"use client";

import { getAttendance, getAttendances } from "@/actions/manager/attendance";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import React, { createContext, useState } from "react";
import { useLayout } from "../provider";

const AttendanceContext = createContext<{
  user: UseData<typeof getAttendances> & {
    selected: string;
    onSelect: (value: string) => void;
  };
  attendance: UseData<typeof getAttendance>;
  sidebar: boolean;
  setSidebar: (value: boolean) => void;
} | null>(null);

export const useAttendance = () => useContext(AttendanceContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const [selected, onSelect] = useState("");
  const { year, month } = useLayout();
  const [user, userLoading] = useData(
    getAttendances,
    (data) => {
      const value = data.find((v) => v.id == selected)?.id ?? data[0]?.id;
      if (value) {
        onSelect(value);
      }
    },
    year,
    month
  );
  const [attendance, attendanceLoading] = useData(
    getAttendance,
    () => {},
    selected,
    year,
    month
  );

  const [sidebar, setSidebar] = useState(false);

  return (
    <AttendanceContext.Provider
      value={{
        user: { data: user, isLoading: userLoading, selected, onSelect },
        attendance: { data: attendance, isLoading: attendanceLoading },
        sidebar,
        setSidebar,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}
