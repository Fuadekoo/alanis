"use client";

import { cn } from "@heroui/react";
import { useAttendance } from "./provider";
import { Button, ScrollShadow, Skeleton } from "@/components/ui/heroui";
import { ChevronLeft } from "lucide-react";
import useAmharic from "@/hooks/useAmharic";

export function Detail() {
  const {
    attendance: { data, isLoading },
    sidebar,
    setSidebar,
  } = useAttendance();
  const isAm = useAmharic();

  return (
    <div
      className={cn(
        "z-20 md:grid  overflow-hidden ",
        sidebar
          ? "max-md:absolute max-md:inset-0 max-md:p-2 max-md:bg-default-500/10 max-md:backdrop-blur-3xl max-md:grid"
          : "max-md:hidden"
      )}
    >
      {isLoading || !data ? (
        <Skeleton className="size-full" />
      ) : (
        <div className="flex gap-2 flex-col overflow-auto">
          <div className="p-2 bg-default-50/50 rounded-xl text-xl capitalize flex gap-2 ">
            <Button
              isIconOnly
              className="md:hidden"
              onPress={setSidebar.bind(undefined, false)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="content-center flex gap-5 items-center">
              <span className="">{data.user?.firstName || "_-_-_-_-_-"}</span>
              <span className="">{data.user?.fatherName || "_-_-_-_-_-"}</span>
              <span className="">{data.user?.lastName || "_-_-_-_-_-"}</span>
            </p>
          </div>

          <ScrollShadow
            size={100}
            className="p-2 pb-40 border border-default-50/50 rounded-xl flex gap-2 flex-col "
          >
            <div className="shrink-0 p-2 md:p-5 bg-default-50/50 rounded-xl grid gap-2">
              <p className="grid grid-cols-3  ">
                <span className="">{isAm ? "ከጧት" : "morning"}</span>
                <span className="text-center ">{`${
                  data.attendance.filter(
                    (v) => !!v[1].morning && v[1].morning.time !== "skip"
                  ).length
                } / ${data.attendance.length}`}</span>
                {((value) => (
                  <span
                    className={cn(
                      "px-2 text-end  ",
                      value == 0 ? "text-success-600" : "text-danger-600"
                    )}
                  >
                    {value} m
                  </span>
                ))(
                  data.attendance.reduce(
                    (sum, [, { morning }]) => sum + (morning?.lateMinute ?? 0),
                    0
                  )
                )}
              </p>
              <p className="grid grid-cols-3  ">
                <span className="">{isAm ? "ከሰዓት" : "afternoon"}</span>
                <span className="text-center ">{`${
                  data.attendance.filter(
                    (v) => !!v[1].afternoon && v[1].afternoon.time !== "skip"
                  ).length
                } / ${data.attendance.length}`}</span>
                {((value) => (
                  <span
                    className={cn(
                      "px-2 text-end  ",
                      value == 0 ? "text-success-600" : "text-danger-600"
                    )}
                  >
                    {value} m
                  </span>
                ))(
                  data.attendance.reduce(
                    (sum, [, { afternoon }]) =>
                      sum + (afternoon?.lateMinute ?? 0),
                    0
                  )
                )}
              </p>
              <p className="grid grid-cols-3  ">
                <span className="">{isAm ? "አጠቃላይ ደቂቃ" : "total minute"}</span>
                <span className="text-center "></span>
                {((value) => (
                  <span
                    className={cn(
                      "px-2 text-end  ",
                      value == 0 ? "text-success-600" : "text-danger-600"
                    )}
                  >
                    {value} m
                  </span>
                ))(
                  data.attendance.reduce(
                    (sum, [, { morning, afternoon }]) =>
                      sum +
                      (morning?.lateMinute ?? 0) +
                      (afternoon?.lateMinute ?? 0),
                    0
                  )
                )}
              </p>
              <p className="grid grid-cols-3  ">
                <span className="">{isAm ? "ተቀናሽ" : "deduction"}</span>
                <span className=""></span>
                <span className="text-end">{data.deduction} ETB</span>
              </p>
            </div>
            {data.attendance.map(([date, { morning, afternoon }], i) => (
              <div
                key={i + ""}
                className={cn(
                  "p-2 border rounded-xl grid md:grid-cols-2 gap-x-10 ",
                  data.today == date
                    ? "bg-secondary/20 border-secondary text-secondary-600 "
                    : "bg-default-50/50 border-default-50/80 "
                )}
              >
                <p className="p-2 content-center ">{date}</p>
                <div
                  className={cn(
                    "divide-y  ",
                    data.today == date
                      ? "divide-secondary "
                      : "divide-default-50/80 "
                  )}
                >
                  <p className="p-2 grid grid-cols-2 ">
                    <span className="text-center ">
                      {morning?.time
                        ? morning.time == "skip"
                          ? isAm
                            ? "የተዘለለ"
                            : "Skip"
                          : morning.time
                        : "_-:_- _-"}
                    </span>
                    <span
                      className={cn(
                        "text-center ",
                        morning?.lateMinute == 0
                          ? "text-success-600"
                          : "text-danger-600"
                      )}
                    >
                      {morning?.lateMinute == undefined
                        ? isAm
                          ? "ቀሪ"
                          : "absent"
                        : `${morning.lateMinute} m`}
                    </span>
                  </p>
                  <p className="p-2 grid grid-cols-2">
                    <span className="text-center">
                      {afternoon?.time
                        ? afternoon.time == "skip"
                          ? isAm
                            ? "የተዘለለ"
                            : "Skip"
                          : afternoon.time
                        : "_-:_- _-"}
                    </span>
                    <span
                      className={cn(
                        "text-center ",
                        afternoon?.lateMinute == 0
                          ? "text-success-600"
                          : "text-danger-600"
                      )}
                    >
                      {afternoon?.lateMinute == undefined
                        ? isAm
                          ? "ቀሪ"
                          : "absent"
                        : `${afternoon.lateMinute} m`}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </ScrollShadow>
        </div>
      )}
    </div>
  );
}
