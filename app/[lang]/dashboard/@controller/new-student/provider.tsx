"use client";

import {
  approvedNewStudent,
  deleteNewStudent,
  getNewStudents,
} from "@/actions/controller/new-student";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { UseFilter, useFilter } from "@/hooks/useFilter";
import useMutation from "@/hooks/useMutation";
import React, { createContext, useState } from "react";

const StudentContext = createContext<{
  student: UseFilter &
    UseData<typeof getNewStudents> & {
      selected: string;
      onApproved: (id: string) => void;
      approved: (id: string) => void;
      approvedLoading: boolean;
      deletion: UseDelete;
    };
} | null>(null);

export const useStudent = () => useContext(StudentContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const { filter, ...onFilter } = useFilter();
  const [students, studentLoading, studentRefresh] = useData(
    getNewStudents,
    () => {},
    filter
  );

  const [selected, onApproved] = useState("");

  const [action, approvedLoading] = useMutation(approvedNewStudent, (state) => {
    if (state.status) {
      studentRefresh();
      onApproved("");
    }
  });

  const deletion = useDelete(deleteNewStudent, (state) => {
    if (state.status) {
      studentRefresh();
    }
  });

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
          selected,
          onApproved,
          approved: action,
          approvedLoading,
          deletion,
        },
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
