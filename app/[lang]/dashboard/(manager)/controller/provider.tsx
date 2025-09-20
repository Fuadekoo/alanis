"use client";

import {
  assignController,
  deleteController,
  getController,
  getControllers,
  registerController,
} from "@/actions/manager/controller";
import { useContext } from "@/hooks/useContext";
import useData, { UseData } from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { useFilter, UseFilter } from "@/hooks/useFilter";
import { useRegistration, UseRegistration } from "@/hooks/useRegistration";
import { assignControllerSchema, controllerSchema } from "@/lib/zodSchema";
import { createContext, useState } from "react";

type TContext = {
  controller: UseFilter &
    UseData<typeof getControllers> & {
      selected: string;
      onSelected: (selected: string) => void;
      registration: UseRegistration<typeof registerController>;
      deletion: UseDelete;
    };
  detail: UseData<typeof getController> & {
    refresh: () => void;
    assign: UseRegistration<typeof assignController>;
  };
  isDetail: boolean;
  onDetail: (value: boolean) => void;
};
const ControllerContext = createContext<TContext | null>(null);

export const useController = () => useContext(ControllerContext);
export function Provider({ children }: { children: React.ReactNode }) {
  const { filter, ...onFilter } = useFilter();

  const [controllers, controllerLoading, controllerRefresh] = useData(
    getControllers,
    (data) => {
      const value = data.list.find((v) => v.id == selected) ?? data.list[0];
      if (value) onSelected(value.id);
    },
    filter
  );
  const [selected, onSelected] = useState("none");
  const controllerRegistration = useRegistration(
    registerController,
    controllerSchema,
    (state) => {
      if (state.status) {
        controllerRefresh();
        detailRefresh?.();
      }
    }
  );
  const controllerDeletion = useDelete(deleteController, (state) => {
    if (state.status) {
      controllerRefresh();
    }
  });

  const [detail, detailLoading, detailRefresh] = useData(
    getController,
    () => {},
    selected
  );

  const assign = useRegistration(
    assignController,
    assignControllerSchema,
    (state) => {
      if (state.status) {
      }
    }
  );

  const [isDetail, onDetail] = useState(false);

  return (
    <ControllerContext
      value={{
        controller: {
          filter: {
            ...filter,
            ...onFilter,
          },
          data: controllers,
          isLoading: controllerLoading,
          selected,
          onSelected,
          registration: controllerRegistration,
          deletion: controllerDeletion,
        },
        detail: {
          data: detail,
          isLoading: detailLoading,
          refresh: detailRefresh,
          assign,
        },
        isDetail,
        onDetail,
      }}
    >
      {children}
    </ControllerContext>
  );
}
