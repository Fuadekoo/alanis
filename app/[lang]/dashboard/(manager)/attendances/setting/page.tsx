"use client";

import { Skeleton } from "@/components/ui/heroui";
import useData from "@/hooks/useData";
import React, { useState } from "react";
import { useLayout } from "../provider";
import { getAttendanceSetting } from "@/actions/manager/attendance";
import { EditChange } from "./editChange";
import { Data } from "./data";

export default function Page() {
  const [isEdit, setEdit] = useState(false);
  const { year, month } = useLayout();
  const [data, isLoading, refresh] = useData(
    getAttendanceSetting,
    () => {},
    year,
    month
  );

  return (
    <div className="p-2 grid md:justify-center overflow-auto ">
      {isLoading || !data ? (
        <Skeleton className="min-w-3xl h-80" />
      ) : isEdit ? (
        <EditChange data={data} setEdit={setEdit} refresh={refresh} />
      ) : (
        <Data data={data} setEdit={setEdit} />
      )}
    </div>
  );
}
