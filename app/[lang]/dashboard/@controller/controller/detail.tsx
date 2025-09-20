"use client";

import React from "react";
import { useController } from "./provider";
import { cn } from "@heroui/react";
import { Button, Skeleton } from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import { UserStatus } from "@/components/userStatus";
import UserDetailCard from "@/components/userDetailCard";

export default function Detail() {
  const {
    controller: { registration, deletion },
    detail: { data, isLoading, refresh },
    isDetail,
    onDetail,
  } = useController();
  const isAm = useAmharic();

  return (
    <div
      className={cn(
        "md:grid overflow-hidden",
        isDetail
          ? "z-20 max-md:grid max-md:absolute max-md:inset-0 max-md:bg-default-900/20 max-md:backdrop-blur-3xl "
          : "max-md:hidden"
      )}
    >
      <div className="md:w-96 p-2 grid overflow-hidden">
        {!data || isLoading ? (
          <Skeleton className="h-full" />
        ) : (
          <div className="grid gap-4 grid-rows-[auto_1fr_auto] overflow-auto ">
            <UserDetailCard
              {...data}
              status={
                <UserStatus
                  id={data.id}
                  status={data.status}
                  refresh={refresh}
                />
              }
              onEdit={registration.edit.bind(undefined, {
                ...data,
                phoneNumber: data.phoneNumber,
                age: data.age + "",
                username: data.username,
                password: "",
              })}
              onDelete={deletion.open.bind(undefined, data.id)}
            />

            <div className="border border-primary/50 rounded-xl shrink-0 ">
              <p className="p-2 bg-primary/20 rounded-t-xl">
                {isAm ? "የተማሪ ዝርዝር" : "Student List"}
              </p>
              <div className="p-2 flex gap-2 flex-col divide-y divide-primary/50">
                {data.students.map(
                  ({ id, firstName, fatherName, lastName }, i) => (
                    <div key={id} className="p-2 ">
                      {i + 1} {firstName} {fatherName} {lastName}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="md:hidden p-2 grid">
              <Button
                className="bg-default-50/50"
                onPress={onDetail.bind(undefined, false)}
              >
                {isAm ? "ይመለሱ" : "Back"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
