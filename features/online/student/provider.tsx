"use client";

import { registerRoom } from "@/actions/controller/room";
import {
  deleteStudent,
  getStudent,
  getStudents,
  registerStudent,
} from "@/actions/controller/student";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { UseFilter, useFilter } from "@/hooks/useFilter";
import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
import { roomSchema, studentSchema } from "@/lib/zodSchema";
import React, { createContext, useState } from "react";

const StudentContext = createContext<{
  student: UseFilter &
    UseData<typeof getStudents> & {
      refresh: () => void;
      selected: string;
      onSelected: (selected: string) => void;
      registration: UseRegistration<typeof registerStudent>;
      deletion: UseDelete;
    };
  isDetail: boolean;
  onDetail: (value: boolean) => void;
  detail: UseData<typeof getStudent> & {
    registration: UseRegistration<typeof registerRoom>;
    refresh: () => void;
  };
} | null>(null);

export const useStudent = () => useContext(StudentContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const { filter, ...onFilter } = useFilter();
  const [selected, onSelected] = useState("none");
  const [students, studentLoading, studentRefresh] = useData(
    getStudents,
    (data) => {
      const value = data.list.find((v) => v.id == selected) ?? data.list[0];
      if (value) onSelected(value.id);
    },
    filter
  );
  const registration = useRegistration(
    registerStudent,
    studentSchema,
    (state) => {
      if (state.status) {
        studentRefresh();
        detailRefresh?.();
      }
    }
  );
  const deletion = useDelete(deleteStudent, (state) => {
    if (state.status) studentRefresh();
  });
  const [detail, detailLoading, detailRefresh] = useData(
    getStudent,
    () => {},
    selected
  );

  const assignRoom = useRegistration(registerRoom, roomSchema, (state) => {
    if (state.status) {
      detailRefresh();
    }
  });

  const [isDetail, onDetail] = useState(false);

  return (
    <StudentContext.Provider
      value={{
        student: {
          filter: {
            ...filter,
            ...onFilter,
          },
          data: students,
          isLoading: studentLoading,
          refresh: studentRefresh,
          selected,
          onSelected,
          registration,
          deletion,
        },
        isDetail,
        onDetail,
        detail: {
          data: detail,
          isLoading: detailLoading,
          refresh: detailRefresh,
          registration: assignRoom,
        },
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
