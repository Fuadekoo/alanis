"use server";

import prisma from "@/lib/db";
import { MutationState, TAttendance } from "@/lib/definitions";
import { isAuthorized, timeFormat12 } from "@/lib/utils";
import { verify } from "jsonwebtoken";

export async function registerAttendance(
  token: string
): Promise<MutationState> {
  try {
    const attendanceSecret = process.env.AUTH_SECRET,
      attendanceValue = process.env.ATTENDANCE_VALUE;
    if (!attendanceSecret || !attendanceValue) throw new Error();
    const tokenData = verify(token, attendanceSecret) as {
      value: string;
    };
    if (tokenData.value !== attendanceValue) throw new Error();

    const controller = await isAuthorized("controller");
    const now = new Date(),
      morningScanStart = new Date(),
      morningWorkEnd = new Date(),
      afternoonScanStart = new Date(),
      afternoonWorkEnd = new Date();

    const timeData = await prisma.attendanceTime
      .findMany({
        where: { year: now.getFullYear(), month: now.getMonth() },
      })
      .then((res) =>
        res.reduce(
          (acc, cc) => ({ ...acc, [cc.name]: cc.time }),
          {} as Record<
            | "morningScanStart"
            | "morningWorkEnd"
            | "afternoonScanStart"
            | "afternoonWorkEnd",
            string
          >
        )
      );

    if (timeData.morningScanStart) {
      morningScanStart.setHours(+timeData.morningScanStart.split(":")[0]);
      morningScanStart.setMinutes(+timeData.morningScanStart.split(":")[1]);
    }
    morningScanStart.setSeconds(0);
    morningScanStart.setMilliseconds(0);

    if (timeData.morningWorkEnd) {
      morningWorkEnd.setHours(+timeData.morningWorkEnd.split(":")[0]);
      morningWorkEnd.setMinutes(+timeData.morningScanStart.split(":")[1]);
    }
    morningWorkEnd.setSeconds(0);
    morningWorkEnd.setMilliseconds(0);

    if (timeData.afternoonScanStart) {
      afternoonScanStart.setHours(+timeData.afternoonScanStart.split(":")[0]);
      afternoonScanStart.setMinutes(+timeData.afternoonScanStart.split(":")[1]);
    }
    afternoonScanStart.setSeconds(0);
    afternoonScanStart.setMilliseconds(0);

    if (timeData.afternoonWorkEnd) {
      afternoonWorkEnd.setHours(+timeData.afternoonWorkEnd.split(":")[0]);
      afternoonWorkEnd.setMinutes(+timeData.afternoonWorkEnd.split(":")[1]);
    }
    afternoonWorkEnd.setSeconds(0);
    afternoonWorkEnd.setMilliseconds(0);

    if (now > morningScanStart && now < morningWorkEnd) {
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: controller.id,
          date: { gte: morningScanStart, lte: morningWorkEnd },
          time: "morning",
        },
      });
      if (attendance) {
        return {
          status: true,
          message: attendance.date.toLocaleString(),
        };
      } else {
        const newAttendance = await prisma.attendance.create({
          data: { userId: controller.id, time: "morning" },
        });
        return {
          status: true,
          message: newAttendance.date.toLocaleString(),
        };
      }
    } else if (now > afternoonScanStart && now < afternoonWorkEnd) {
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: controller.id,
          time: "afternoon",
        },
      });

      if (attendance) {
        return {
          status: true,
          message: attendance.date.toLocaleString(),
        };
      } else {
        const newAttendance = await prisma.attendance.create({
          data: { userId: controller.id, time: "afternoon" },
        });
        return {
          status: true,
          message: newAttendance.date.toLocaleString(),
        };
      }
    } else {
      return { status: false, message: "This is not working time" };
    }
  } catch {
    return {
      status: false,
      message: "Failed to  registered your attendance, Retry",
    };
  }
}

export async function getAttendance(year: number, month: number) {
  const today = new Date();
  const totalDays =
    today.getFullYear() == year && today.getMonth() == month
      ? today.getDate()
      : new Date(year, month + 1, 0).getDate();
  const controller = await isAuthorized("controller");
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
              userId: controller.id,
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

  return {
    attendance,
    deduction,
    today: new Date().toString().slice(0, 15),
  };
}
