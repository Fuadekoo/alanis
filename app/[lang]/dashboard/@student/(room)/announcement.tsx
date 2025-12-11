"use client";

import { getAnnouncement } from "@/actions/student/announcement";
import useData from "@/hooks/useData";
import React from "react";

export function Announcement() {
  const [data] = useData(getAnnouncement, () => {});

  return (
    data && (
      <div className="flex gap-1 overflow-x-auto ">
        {data.map(({ text, date }, i) => (
          <div
            key={i + ""}
            className="w-80 p-2 shrink-0 bg-default-900/80 dark:bg-default-800 backdrop-blur-3xl border border-default-700 dark:border-default-600 rounded-xl"
          >
            <p className="text-default-100 dark:text-default-200">{text}</p>
            <p className="text-xs text-default-400 dark:text-default-500">
              {date.toString().slice(4, 15)}
            </p>
          </div>
        ))}
      </div>
    )
  );
}
