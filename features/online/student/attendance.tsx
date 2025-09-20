import { useState } from "react";
import useData from "@/hooks/useData";
import { getRoomAttendance } from "@/actions/controller/teacher";
import { Button, ButtonGroup, Skeleton } from "@/components/ui/heroui";
import { Minus, Plus } from "lucide-react";
import { useStudent } from "./provider";
import { Chip } from "@heroui/react";
import { timeFormat12 } from "@/lib/utils";

export function Attendance() {
  const [filter, setFilter] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const {
    student: { selected },
  } = useStudent();

  const [data, isLoading] = useData(
    getRoomAttendance,
    () => {},
    selected,
    filter.year,
    filter.month
  );

  return (
    <div className=" grid gap-2 grid-rows-[auto_1fr] overflow-hidden ">
      <div className="grid gap-2 grid-cols-2">
        <ButtonGroup className="w-full items-stretch gap-[2px]">
          <Button
            isIconOnly
            className="bg-default-50/50"
            onPress={() => {
              setFilter((prev) => ({
                ...prev,
                year: prev.year == 0 ? 0 : prev.year - 1,
              }));
            }}
          >
            <Plus className="size-4" />
          </Button>
          <p className="w-full px-5 content-center text-center bg-default-50/50">
            {filter.year}
          </p>
          <Button
            isIconOnly
            className="bg-default-50/50"
            onPress={() => {
              setFilter((prev) => ({
                ...prev,
                year: prev.year + 1,
              }));
            }}
          >
            <Minus className="size-4" />
          </Button>
        </ButtonGroup>
        {/*  */}
        <ButtonGroup className="w-full items-stretch gap-[2px]">
          <Button
            isIconOnly
            className="bg-default-50/50"
            onPress={() => {
              setFilter((prev) => ({
                ...prev,
                month: prev.month == 0 ? 0 : prev.month - 1,
              }));
            }}
          >
            <Plus className="size-4" />
          </Button>
          <p className="w-full px-5 content-center text-center bg-default-50/50">
            {filter.month}
          </p>
          <Button
            isIconOnly
            className="bg-default-50/50"
            onPress={() => {
              setFilter((prev) => ({
                ...prev,
                month: prev.month + 1,
              }));
            }}
          >
            <Minus className="size-4" />
          </Button>
        </ButtonGroup>
      </div>
      {isLoading || !data ? (
        <Skeleton className="" />
      ) : (
        <div className="py-1 flex flex-col gap-2 overflow-auto ">
          {data.map(([date, { room }], i) => (
            <div key={i + ""} className="bg-default-50/50 rounded-lg p-1 ">
              <p className="p-1">{new Date(date).toString().slice(4, 15)}</p>
              <div className="flex flex-col border border-default-300 rounded-md divide-y divide-default-300 ">
                {room.map((v, index) => (
                  <p
                    key={index + ""}
                    className="py-1 px-2 grid gap-1 grid-cols-[1fr_auto_auto]"
                  >
                    <p className="">
                      {v.user.firstName} {v.user.fatherName} {v.user.lastName}
                    </p>
                    <Chip variant="flat" color="primary">
                      {timeFormat12(v.time)}
                    </Chip>
                    <Chip variant="flat" color="primary">
                      {v.other ? timeFormat12(v.other) : "_-_-_-_-_-"}
                    </Chip>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
