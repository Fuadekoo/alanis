"use client";

import React, { useState } from "react";
import { useTeacher } from "./provider";
import { cn } from "@heroui/react";
import { Skeleton } from "@/components/ui/heroui";
import AssignedRoom from "./assignedRoom";
import { UserStatus } from "@/components/userStatus";
import UserDetailCard from "@/components/userDetailCard";
import { Attendance } from "./attendance";
import DetailTab from "@/components/detailTab";

export default function Detail() {
  const {
    teacher: { registration, deletion },
    detail: { data, isLoading, refresh },
    isDetail,
    onDetail,
  } = useTeacher();
  // const isAm = useAmharic();
  const [tab, setTab] = useState("profile");

  return (
    <div
      className={cn(
        "md:grid overflow-hidden",
        isDetail
          ? "z-20 max-md:grid max-md:absolute max-md:inset-0 max-md:bg-default-900/20 max-md:backdrop-blur-3xl "
          : "max-md:hidden"
      )}
    >
      <div className="md:w-[30rem] p-2 grid overflow-hidden">
        {!data || isLoading ? (
          <Skeleton className="h-full" />
        ) : (
          <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden ">
            <DetailTab
              back={onDetail.bind(undefined, false)}
              tab={tab}
              setTab={setTab}
            />
            {tab == "profile" ? (
              <UserDetailCard
                {...data}
                status={
                  <UserStatus
                    id={data.id}
                    status={data.status}
                    refresh={refresh}
                  />
                }
                onEdit={() =>
                  registration.edit({
                    ...data,
                    phoneNumber: data.phoneNumber,
                    age: data.age + "",
                    username: data.username,
                    password: "",
                  })
                }
                onDelete={() => deletion.open(data.id)}
              />
            ) : tab == "room" ? (
              <AssignedRoom />
            ) : tab == "attendance" ? (
              <Attendance />
            ) : (
              ""
            )}
          </div>
        )}
      </div>
    </div>
  );
}
