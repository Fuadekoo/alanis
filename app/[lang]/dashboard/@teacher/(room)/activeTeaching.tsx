"use client";

import { getActiveTeachingStats } from "@/actions/teacher/room";
import useData from "@/hooks/useData";
import { Skeleton } from "@/components/ui/heroui";
import { BookOpen, CalendarX } from "lucide-react";
import React from "react";

export default function ActiveTeaching() {
  const [data, isLoading] = useData(getActiveTeachingStats, () => {});

  if (isLoading || !data) {
    return (
      <div className="p-2 bg-default-50/50 rounded-xl">
        <Skeleton className="h-12 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-2 bg-default-50/50 rounded-xl">
      <div className="flex items-center justify-between gap-4">
        {/* Total Teaching Date */}
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-xs text-default-600 dark:text-default-400">
            Total Teaching Date:
          </span>
          <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
            {data.totalTeachingDate}
          </span>
        </div>

        {/* Missing Date */}
        <div className="flex items-center gap-2 flex-1">
          <CalendarX className="h-4 w-4 text-danger-600 dark:text-danger-400" />
          <span className="text-xs text-default-600 dark:text-default-400">
            Missing Date:
          </span>
          <span className="text-lg font-bold text-danger-700 dark:text-danger-300">
            {data.missingDate}
          </span>
        </div>
      </div>
    </div>
  );
}
