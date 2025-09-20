"use client";

import React from "react";
import { useController } from "./provider";
import { cn } from "@heroui/react";
import { Button, Select, SelectItem, Skeleton } from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import { UserStatus } from "@/components/userStatus";
import UserDetailCard from "@/components/userDetailCard";
import { Pen } from "lucide-react";
import RegistrationModal from "@/components/registratioModal";
import useData from "@/hooks/useData";
import { getControllerList } from "@/actions/manager/controller";
import { getStudentList } from "@/actions/controller/student";

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
