"use client";

import React from "react";
import { Skeleton } from "@/components/ui/heroui";
import { History } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import TeacherLastStudentHistory from "@/components/teacherLastStudentHistory";
import { getMyStudentHistory } from "@/actions/teacher/history";

export default function Page() {
  const isAm = useAmharic();

  const [data, isLoading] = useData(getMyStudentHistory, () => {});

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <History className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-default-900">
            {isAm ? "የተማሪ ታሪክ" : "Student History"}
          </h1>
          <p className="text-sm text-default-500">
            {isAm
              ? "ከእርስዎ የተለዩ ተማሪዎችን እና የተለዩበትን ሰዓት ይመልከቱ።"
              : "Review students that were detached from you and when they left."}
          </p>
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <Skeleton className="w-full h-80 rounded-xl" />
        ) : data ? (
          <TeacherLastStudentHistory data={data} />
        ) : (
          <div className="grid place-content-center h-full text-center text-default-500">
            {isAm
              ? "የተማሪ ታሪክ ማግኘት አልተሳካም።"
              : "Unable to load student history."}
          </div>
        )}
      </div>
    </div>
  );
}
