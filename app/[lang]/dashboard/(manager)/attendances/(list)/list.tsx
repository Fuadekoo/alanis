"use client";

import { Button, ScrollShadow, Skeleton } from "@/components/ui/heroui";
import { useAttendance } from "./provider";
import { cn } from "@heroui/react";
import useAmharic from "@/hooks/useAmharic";

export function List() {
  const {
    user: { data, isLoading, selected, onSelect },
    setSidebar,
  } = useAttendance();
  const isAm = useAmharic();

  return isLoading || !data ? (
    <Skeleton />
  ) : (
    <div className="bg-default-50/30 rounded-xl overflow-hidden grid grid-rows-[auto_1fr] ">
      <div className="p-2 bg-default-50/50 backdrop-blur-3xl flex">
        <span className="flex-1">{isAm ? "ስም" : "Name"}</span>
        <span className="w-32 text-end">
          {isAm ? "የተረፈደ ደቂቃ" : "Late Minute"}
        </span>
        <span className="w-32 text-end">{isAm ? "ተቀናሽ" : "Deduction"}</span>
      </div>
      <ScrollShadow
        size={100}
        className="p-2 pb-40 flex gap-1 flex-col overflow-auto "
      >
        {data.map(
          (
            { id, firstName, fatherName, lastName, lateMinute, deduction },
            i
          ) => (
            <Button
              key={i + ""}
              className={cn(
                "shrink-0 p-2 ",
                selected == id
                  ? "bg-primary/20 border border-primary-600 "
                  : "bg-default-50/50 border border-default-400"
              )}
              onPress={() => {
                onSelect(id);
                setSidebar(true);
              }}
            >
              <span className="flex-1 capitalize text-start">
                {firstName} {fatherName} {lastName}
              </span>
              <span className="w-32 text-end ">{lateMinute} m</span>
              <span className="w-32 text-end ">{deduction} ETB</span>
            </Button>
          )
        )}
      </ScrollShadow>
    </div>
  );
}
