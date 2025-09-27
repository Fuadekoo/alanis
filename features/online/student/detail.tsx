"use client";

import { Skeleton } from "@/components/ui/heroui";
import { useStudent } from "./provider";
import AssignedRoom from "./assignedRoom";
import { cn } from "@heroui/react";
import { UserStatus } from "@/components/userStatus";
import UserDetailCard from "@/components/userDetailCard";
import { Attendance } from "./attendance";
import UserPaymentDetail from "@/components/userPaymentDetail";
import DetailTab from "./detailTab";
import { useState } from "react";

export default function Detail() {
  const {
    student: { registration, deletion },
    detail: { data, isLoading, refresh },
    isDetail,
    onDetail,
  } = useStudent();
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
                    controllerId: data.controllerId ?? "",
                    password: "",
                    startDate: data.startDate?.toString() ?? "",
                  })
                }
                onDelete={() => deletion.open(data.id)}
              />
            ) : tab == "room" ? (
              <AssignedRoom />
            ) : tab == "payment" ? (
              <>
                <UserPaymentDetail studentId={data.id} />
              </>
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
