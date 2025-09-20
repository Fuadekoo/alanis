"use server";

import prisma from "@/lib/db";
import { TAttendance } from "@/lib/definitions";
import { timeFormat12 } from "@/lib/utils";
import { AttendanceSetting } from "@/lib/zodSchema";
import { attendanceTimeName } from "@prisma/client";

export async function registerDeduction({
  year,
  month,
  whole,
  minute,
  ...data
}: AttendanceSetting) {
  await prisma.deduction.upsert({
    where: { year_month: { year, month } },
    update: { whole, minute },
    create: { year, month, whole, minute },
  });

  await Promise.all(
    Object.entries(data).map(async ([name, time]) => {
      await prisma.attendanceTime.upsert({
        where: {
          year_month_name: {
            year,
            month,
            name: name as attendanceTimeName,
          },
        },
        update: { time },
        create: { year, month, name: name as attendanceTimeName, time },
      });
      return;
    })
  );
  return { status: true, message: "successfully save change" };
}

export async function getAttendance(
  userId: string,
  year: number,
  month: number
) {
  if (!userId)
    return {
      attendance: [],
      deduction: 0,
      today: new Date().toString().slice(0, 15),
    };

  const today = new Date();
  const totalDays =
    today.getFullYear() == year && today.getMonth() == month
      ? today.getDate()
      : new Date(year, month + 1, 0).getDate();
  const { morningWorkStart, afternoonWorkStart } = await prisma.attendanceTime
    .findMany({
      where: { month },
      select: { name: true, time: true },
    })
    .then((res) =>
      res.reduce(
        (a, c) => ({ ...a, [c.name]: c.time }),
        {} as { morningWorkStart?: string; afternoonWorkStart?: string }
      )
    );
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const { wholeSkipDate, skipDate } = await prisma.skipDate
    .findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { date: true, name: true },
    })
    .then((res) => ({
      wholeSkipDate: res
        .filter((v) => v.name == "wholeDay")
        .map((v) => v.date.getDate()),
      skipDate: res
        .filter((v) => v.name !== "wholeDay")
        .map((v) => ({ date: v.date.getDate(), name: v.name })),
    }));

  const attendance = await Array(totalDays)
    .fill({})
    .map((v, i) => i + 1)
    .reverse()
    .filter(
      (v) =>
        ![0].includes(new Date(year, month, v).getDay()) &&
        !wholeSkipDate.includes(v)
    )
    .reduce(async (acc, curr) => {
      const currentStartDate = new Date(year, month, curr);
      currentStartDate.setHours(0);
      currentStartDate.setMinutes(0);
      const currentEndDate = new Date(year, month, curr);
      currentEndDate.setHours(23);
      currentEndDate.setMinutes(0);

      async function getData(
        time: "morning" | "afternoon",
        workStart?: string
      ) {
        if (skipDate.find((v) => v.date == curr && v.name == time)) {
          return { time: "skip", lateMinute: 0 };
        }
        const data = await prisma.attendance
          .findFirst({
            where: {
              userId,
              date: { gte: currentStartDate, lte: currentEndDate },
              time,
            },
            select: { date: true },
          })
          .then((res) => {
            if (!workStart)
              return {
                time: res
                  ? timeFormat12(res.date.toTimeString().split(" ")[0])
                  : "",
                lateMinute: 0,
              };
            if (!res) return undefined;

            const [startHour, startMinute] = workStart.split(":");
            const attendanceDate = new Date(res.date);
            attendanceDate.setHours(+startHour);
            attendanceDate.setMinutes(+startMinute);

            const lateMinute = Math.round(
              (res.date.getTime() - attendanceDate.getTime()) / 60000
            );

            return {
              time: timeFormat12(res.date.toTimeString().split(" ")[0]),
              lateMinute: lateMinute >= 0 ? lateMinute : 0,
            };
          });

        return data;
      }

      (await acc).push([
        currentStartDate.toString().slice(0, 15),
        {
          morning: await getData("morning", morningWorkStart),
          afternoon: await getData("afternoon", afternoonWorkStart),
        },
      ]);

      return acc;
    }, [] as unknown as Promise<TAttendance[]>);

  const deductionRate = await prisma.deduction.findFirst({
    where: { month },
    select: { whole: true, minute: true },
  });

  const deduction = deductionRate
    ? attendance.reduce(
        (a, c) =>
          a +
          (c[1].morning
            ? c[1].morning.lateMinute * +deductionRate.minute
            : +deductionRate.whole) +
          (c[1].afternoon
            ? c[1].afternoon.lateMinute * +deductionRate.minute
            : +deductionRate.whole),
        0
      )
    : 0;

  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { firstName: true, fatherName: true, lastName: true },
  });

  return {
    user,
    attendance,
    deduction,
    today: new Date().toString().slice(0, 15),
  };
}

export async function getAttendances(year: number, month: number) {
  const data = await prisma.user
    .findMany({
      where: { role: "controller" },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
      },
    })
    .then((res) =>
      res.map(async ({ ...rest }) => {
        const { deduction, attendance } = await getAttendance(
          rest.id,
          year,
          month
        );
        return {
          ...rest,
          deduction,
          lateMinute: attendance.reduce(
            (acc, [, { afternoon, morning }]) =>
              acc + (morning?.lateMinute ?? 0) + (afternoon?.lateMinute ?? 0),
            0
          ),
        };
      })
    );

  return await Promise.all(data);
}

export async function getAttendanceSetting(year: number, month: number) {
  const deduction = await prisma.deduction
    .findFirst({
      where: { year, month },
      select: { whole: true, minute: true },
    })
    .catch((err) => {
      console.log(err);
      return null;
    });

  const attendanceTime = await prisma.attendanceTime
    .findMany({
      where: { year, month },
      select: { name: true, time: true },
    })
    .then((res) =>
      res.reduce(
        (acc, cc) => ({ ...acc, [cc.name]: cc.time }),
        {} as Record<attendanceTimeName, string>
      )
    );

  return {
    whole: +(deduction?.whole ?? 0),
    minute: +(deduction?.minute ?? 0),
    morningScanStart: attendanceTime.morningScanStart ?? "",
    morningWorkStart: attendanceTime.morningWorkStart ?? "",
    morningWorkEnd: attendanceTime.morningWorkEnd ?? "",
    afternoonScanStart: attendanceTime.afternoonScanStart ?? "",
    afternoonWorkStart: attendanceTime.afternoonWorkStart ?? "",
    afternoonWorkEnd: attendanceTime.afternoonWorkEnd ?? "",
  };
}
