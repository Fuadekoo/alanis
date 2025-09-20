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
            className="w-80 p-2 shrink-0  bg-secondary/20 backdrop-blur-3xl border border-secondary rounded-xl  "
          >
            <p className="text-secondary-700">{text}</p>
            <p className="text-xs text-default-500 ">
              {date.toString().slice(4, 15)}
            </p>
          </div>
        ))}
      </div>
    )
  );
}
