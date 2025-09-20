"use client";

import { registerRoom } from "@/actions/controller/room";
import {
  deleteTeacher,
  getTeacher,
  getTeachers,
  registerTeacher,
} from "@/actions/controller/teacher";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { useFilter, UseFilter } from "@/hooks/useFilter";
import { useRegistration, UseRegistration } from "@/hooks/useRegistration";
import { roomSchema, teacherSchema } from "@/lib/zodSchema";
import { createContext, useState } from "react";

type TContext = {
  teacher: UseFilter &
    UseData<typeof getTeachers> & {
      selected: string;
      onSelected: (selected: string) => void;
      registration: UseRegistration<typeof registerTeacher>;
      deletion: UseDelete;
    };
  detail: UseData<typeof getTeacher> & {
    registration: UseRegistration<typeof registerRoom>;
    refresh: () => void;
  };
  isDetail: boolean;
  onDetail: (value: boolean) => void;
};
const TeacherContext = createContext<TContext | null>(null);

export const useTeacher = () => useContext(TeacherContext);
export function Provider({ children }: { children: React.ReactNode }) {
  const { filter, ...onFilter } = useFilter();

  const [teachers, teacherLoading, teacherRefresh] = useData(
    getTeachers,
    (data) => {
      const value = data.list.find((v) => v.id == selected) ?? data.list[0];
      if (value) onSelected(value.id);
    },
    filter
  );
  const [selected, onSelected] = useState("none");
  const teacherRegistration = useRegistration(
    registerTeacher,
    teacherSchema,
    (state) => {
      if (state.status) {
        teacherRefresh();
        detailRefresh?.();
      }
    }
  );
  const teacherDeletion = useDelete(deleteTeacher, (state) => {
    if (state.status) {
      teacherRefresh();
    }
  });

  const [detail, detailLoading, detailRefresh] = useData(
    getTeacher,
    () => {},
    selected
  );
  const registration = useRegistration(registerRoom, roomSchema, (state) => {
    if (state.status) {
      detailRefresh();
    }
  });

  const [isDetail, onDetail] = useState(false);

  return (
    <TeacherContext
      value={{
        teacher: {
          filter: {
            ...filter,
            ...onFilter,
          },
          data: teachers,
          isLoading: teacherLoading,
          selected,
          onSelected,
          registration: teacherRegistration,
          deletion: teacherDeletion,
        },
        detail: {
          data: detail,
          isLoading: detailLoading,
          refresh: detailRefresh,
          registration,
        },
        isDetail,
        onDetail,
      }}
    >
      {children}
    </TeacherContext>
  );
}
