"use client";

import { Button, Skeleton } from "@/components/ui/heroui";
import { useStudent } from "./provider";
import AssignedRoom from "./assignedRoom";
import { cn } from "@heroui/react";
import { UserStatus } from "@/components/userStatus";
import UserDetailCard from "@/components/userDetailCard";
import { Attendance } from "./attendance";
import UserPaymentDetail from "@/components/userPaymentDetail";
import DetailTab from "./detailTab";
import { useState } from "react";
import Notes from "./notes";
import LastTeacherHistory from "./lastTeacherHistory";
import LastControllerHistory from "./lastControllerHistory";
import { CheckCircle2 } from "lucide-react";

export default function Detail() {
  const {
    student: { registration },
    detail: {
      data,
      isLoading,
      refresh,
      acceptAssignment,
      acceptAssignmentLoading,
      acceptingStudentId,
    },
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
          ? "z-20 max-md:grid max-md:absolute max-md:inset-0 max-md:h-dvh max-md:bg-default-900/20 max-md:backdrop-blur-3xl "
          : "max-md:hidden"
      )}
    >
      <div className="md:w-[30rem] p-1 h-dvh grid overflow-hidden">
        {!data || isLoading ? (
          <Skeleton className="h-full" />
        ) : (
          <div className="h-dvh grid gap-2 grid-rows-[auto_1fr] overflow-hidden  ">
            <DetailTab
              back={onDetail.bind(undefined, false)}
              tab={tab}
              setTab={setTab}
            />
             

            
            {tab == "profile" ? (
              <div className="grid gap-2 overflow-auto">
                {data.pendingController && (
                  <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 grid gap-3">
                    <div className="grid gap-1">
                      <p className="font-semibold text-warning-800">
                        Pending Controller Change
                      </p>
                      <p className="text-sm text-warning-700">
                        {data.requiresControllerAcceptance
                          ? "This student is waiting for your acceptance before joining your active student list."
                          : `Waiting for ${data.pendingController.firstName} ${data.pendingController.fatherName} ${data.pendingController.lastName} to accept this controller change.`}
                      </p>
                    </div>
                    {data.requiresControllerAcceptance && (
                      <Button
                        color="success"
                        className="justify-self-start"
                        startContent={<CheckCircle2 className="size-4" />}
                        isLoading={
                          acceptAssignmentLoading &&
                          acceptingStudentId === data.id
                        }
                        onPress={() => acceptAssignment(data.id)}
                      >
                        Accept Student
                      </Button>
                    )}
                  </div>
                )}

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
                      controllerId:
                        data.pendingControllerId ?? data.controllerId ?? "",
                      password: "",
                      startDate: data.startDate?.toString() ?? "",
                    })
                  }
                />
              </div>
            ) : tab == "notes" ? (
              <Notes />
            ) : tab == "room" ? (
              <AssignedRoom />
            ) : tab == "payment" ? (
              <>
                <UserPaymentDetail studentId={data.id} />
              </>
            ) : tab == "attendance" ? (
              <Attendance />
            ) : tab == "tLast" ? (
              <LastTeacherHistory />
            ) : tab == "cLast" ? (
              <LastControllerHistory />
            ) : (
              ""
            )}
          </div>
        )}
      </div>
    </div>
  );
}
