"use client";

import React from "react";
import { useController } from "./provider";
import { cn } from "@heroui/react";
import { Button, Select, SelectItem, Skeleton } from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import { UserStatus } from "@/components/userStatus";
import UserDetailCard from "@/components/userDetailCard";
import { Clock3, History, Pen } from "lucide-react";
import RegistrationModal from "@/components/registratioModal";
import useData from "@/hooks/useData";
import { getControllerList } from "@/actions/manager/controller";
import { getStudentList } from "@/actions/controller/student";

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "_-_-_-_-_-";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Detail() {
  const {
    controller: { registration, deletion },
    detail: { data, isLoading, refresh, assign },
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
              <div className="p-2 bg-primary/10 rounded-t-xl flex gap-2">
                <p className="flex-1">{isAm ? "የተማሪ ዝርዝር" : "Student List"}</p>
                <Button
                  variant="flat"
                  color="primary"
                  className="shrink-0"
                  startContent={<Pen className="size-4" />}
                  onPress={() => assign.add()}
                >
                  {isAm ? "ተማሪ ይመድቡ" : "assign student"}
                </Button>
              </div>
	              <div className="p-2 flex gap-2 flex-col divide-y divide-primary/50">
	                {data.students.map(
                  (
                    { id, firstName, fatherName, lastName, controllerId },
                    i
                  ) => (
                    <div key={id} className="p-2 flex gap-2 items-center ">
                      <p className="flex-1 ">
                        {i + 1} {firstName} {fatherName} {lastName}
                      </p>
                      <Button
                        variant="flat"
                        color="primary"
                        isIconOnly
                        onPress={() =>
                          assign.edit({ id, controllerId: controllerId ?? "" })
                        }
                      >
                        <Pen className="size-4" />
                      </Button>
                    </div>
                  )
	                )}
	              </div>
	            </div>

	            <div className="border border-default-300 rounded-xl shrink-0 overflow-hidden">
	              <div className="p-3 bg-default-100/60 flex items-start gap-3">
	                <div className="p-2 rounded-lg bg-primary/10 text-primary">
	                  <History className="size-4" />
	                </div>
	                <div>
	                  <p className="font-medium">
	                    {isAm ? "የቀድሞ ተማሪዎች" : "Previous Students"}
	                  </p>
	                  <p className="text-xs text-default-600">
	                    {isAm
	                      ? "ከዚህ ተቆጣጣሪ የተለዩ የተማሪ ምደባዎች"
	                      : "Student assignments that have already been detached from this controller."}
	                  </p>
	                </div>
	              </div>
	              <div className="p-2 flex gap-2 flex-col divide-y divide-default-200">
	                {data.lastStudents.length === 0 ? (
	                  <div className="p-2 text-sm text-default-600">
	                    {isAm
	                      ? "እስካሁን የቀድሞ ተማሪ ታሪክ የለም።"
	                      : "No previous student history has been recorded for this controller yet."}
	                  </div>
	                ) : (
	                  data.lastStudents.map(
	                    ({ id, student, assignedAt, detachedAt }, i) => (
	                      <div key={id} className="p-2 grid gap-1">
	                        <div className="flex gap-2 items-center">
	                          <p className="flex-1 font-medium">
	                            {i + 1}. {student.firstName} {student.fatherName}{" "}
	                            {student.lastName}
	                          </p>
	                          <div className="text-xs px-2 py-1 rounded-md bg-danger/10 text-danger-700">
	                            {isAm ? "ተለይቷል" : "Detached"}
	                          </div>
	                        </div>
	                        <div className="text-sm text-default-600 grid gap-1">
	                          <p>
	                            {isAm ? "ተመድቦ የነበረበት" : "Assigned"}:{" "}
	                            {formatDateTime(assignedAt)}
	                          </p>
	                          <p className="flex items-center gap-2">
	                            <Clock3 className="size-4" />
	                            <span>
	                              {isAm ? "የተለየበት" : "Detached"}:{" "}
	                              {formatDateTime(detachedAt)}
	                            </span>
	                          </p>
	                        </div>
	                      </div>
	                    )
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
      <Assign />
    </div>
  );
}

function Assign() {
  const {
    detail: { assign },
  } = useController();
  const isAm = useAmharic();
  const [controller] = useData(getControllerList, () => {});
  const [student] = useData(getStudentList, () => {});

  return (
    controller &&
    student && (
      <RegistrationModal
        {...assign}
        title={isAm ? "ተቆጣጣሪ ምደባ" : "controller assign"}
      >
        <Select
          label={isAm ? "ተቆጣጣሪ" : "Controller"}
          {...assign.register("controllerId")}
        >
          {controller.map(({ id, firstName, fatherName, lastName }) => (
            <SelectItem key={id}>
              {`${firstName} ${fatherName} ${lastName}`}
            </SelectItem>
          ))}
        </Select>
        <Select label={isAm ? "ተማሪ" : "Student"} {...assign.register("id")}>
          {student.map(({ id, firstName, fatherName, lastName }) => (
            <SelectItem key={id}>
              {`${firstName} ${fatherName} ${lastName}`}
            </SelectItem>
          ))}
        </Select>
      </RegistrationModal>
    )
  );
}
