import { getAttendance } from "@/actions/controller/attendance";
import { Button, ScrollShadow } from "@/components/ui/heroui";
import { TAttendance } from "@/lib/definitions";
import { cn } from "@heroui/react";
import { QrCode } from "lucide-react";
import Link from "next/link";
import React from "react";
import YearMonthSelect from "../../../../../components/yearMonthSelect";
import { z } from "zod";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const isAm = (await params).lang == "am";
  const parseQuery = await z
    .object({
      year: z.coerce.number().min(2025).max(2035),
      month: z.coerce.number().min(0).max(11),
    })
    .safeParseAsync(await searchParams);
  if (!parseQuery.success) {
    const data = { deduction: 0, attendance: [], today: "" };
    return (
      <div className="p-2 md:p-5 grid md:justify-center overflow-hidden ">
        <div className="md:max-w-4xl overflow-hidden grid max-md:grid-rows-[auto_1fr] md:grid-cols-[auto_1fr] gap-y-2 gap-x-2 xl:gap-x-20 ">
          <Detail {...data} isAm={isAm} />
          <List {...data} isAm={isAm} />
        </div>
      </div>
    );
  }
  const data = await getAttendance(parseQuery.data.year, parseQuery.data.month);

  return (
    <div className="p-2 md:p-5 grid md:justify-center overflow-hidden ">
      <div className="md:max-w-4xl overflow-hidden grid max-md:grid-rows-[auto_1fr] md:grid-cols-[auto_1fr] gap-y-2 gap-x-2 xl:gap-x-20 ">
        <Detail {...data} isAm={isAm} />
        <List {...data} isAm={isAm} />
      </div>
    </div>
  );
}

function Detail({
  isAm,
  deduction,
  attendance,
}: {
  isAm: boolean;
  attendance: TAttendance[];
  deduction: number;
}) {
  return (
    <div
      className={cn(
        "md:w-96 p-2 border border-default-50/30 rounded-xl flex gap-5 flex-col"
      )}
    >
      <YearMonthSelect />

      <p className="p-2 bg-default-50/40 rounded-md grid gap-2 grid-cols-3">
        <span className="">{isAm ? "ተቀናሽ" : "deduction"}</span>
        <span className=""></span>
        <span className="text-end text-xl font-extrabold ">
          {deduction} ETB
        </span>
      </p>

      <div className="p-2 bg-default-50/40 rounded-md flex gap-5 flex-col">
        <p className=" grid gap-2 grid-cols-3">
          <span className="">{isAm ? "ከጧት" : "morning"}</span>
          <span className="text-end">
            {`${
              attendance.filter(
                (v) => !!v[1].morning && v[1].morning.time !== "skip"
              ).length
            } / ${attendance.length}`}
          </span>
          {((value) => (
            <span
              className={cn(
                "text-end ",
                value == 0 ? "text-success-600" : "text-danger-600"
              )}
            >
              {value} m
            </span>
          ))(
            attendance.reduce(
              (sum, [, { morning }]) => sum + (morning?.lateMinute ?? 0),
              0
            )
          )}
        </p>
        <p className=" grid gap-2 grid-cols-3">
          <span className="">{isAm ? "ከሰዓት" : "afternoon"}</span>
          <span className="text-end">
            {
              attendance.filter(
                (v) => !!v[1].afternoon && v[1].afternoon.time !== "skip"
              ).length
            }{" "}
            / {attendance.length}
          </span>
          {((value) => (
            <span
              className={cn(
                "text-end",
                value == 0 ? "text-success-600" : "text-danger-600"
              )}
            >
              {value} m
            </span>
          ))(
            attendance.reduce(
              (sum, [, { afternoon }]) => sum + (afternoon?.lateMinute ?? 0),
              0
            )
          )}
        </p>
        <p className=" grid gap-2 grid-cols-3">
          <span className="">{isAm ? "አጠቃላይ ደቂቃ" : "total minute"}</span>
          <span className=""></span>
          {((value) => (
            <span
              className={cn(
                "text-end font-bold",
                value == 0 ? "text-success-600" : "text-danger-600"
              )}
            >
              {value} m
            </span>
          ))(
            attendance.reduce(
              (a, [, { morning, afternoon }]) =>
                a + (morning?.lateMinute ?? 0) + (afternoon?.lateMinute ?? 0),
              0
            )
          )}
        </p>
      </div>
      <Button
        color="primary"
        startContent={<QrCode className="size-4 shrink-0" />}
        as={Link}
        href="attendance/scan"
      >
        {isAm ? "አቴንዳንስ ይያዙ" : "take Attendance"}
      </Button>
    </div>
  );
}

function List({
  isAm,
  attendance,
  today,
}: {
  isAm: boolean;
  attendance: TAttendance[];
  today: string;
}) {
  return (
    <ScrollShadow
      size={100}
      className="p-2 pb-40 border border-default-50/50 rounded-xl flex gap-2 flex-col "
    >
      {attendance.map(([date, { morning, afternoon }], i) => (
        <div
          key={i + ""}
          className={cn(
            "p-2 border rounded-xl grid md:grid-cols-2 gap-x-10 ",
            today == date
              ? "bg-secondary/20 border-secondary text-secondary-600 "
              : "bg-default-50/50 border-default-50/80 "
          )}
        >
          <p className="p-2 content-center ">{date}</p>
          <div
            className={cn(
              "divide-y  ",
              today == date ? "divide-secondary " : "divide-default-50/80 "
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
  );
}
