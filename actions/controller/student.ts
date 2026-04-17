"use server";

import { Filter, MutationState } from "@/lib/definitions";
import { getLocalDate, sorting } from "@/lib/utils";
import { StudentSchema } from "@/lib/zodSchema";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function registerStudent({
  id,
  password,
  ...data
}: StudentSchema): Promise<MutationState> {
  if (id) {
    await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        fatherName: data.fatherName,
        lastName: data.lastName,
        gender: data.gender,
        age: +data.age,
        phoneNumber: data.phoneNumber,
        country: data.country,
        username: data.username,
        controllerId: data.controllerId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
      },
    });
  } else {
    await prisma.user.create({
      data: {
        role: "student",
        firstName: data.firstName,
        fatherName: data.fatherName,
        lastName: data.lastName,
        gender: data.gender,
        age: +data.age,
        phoneNumber: data.phoneNumber,
        country: data.country,
        username: data.username,
        controllerId: data.controllerId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        password: await bcrypt.hash(password, 12),
      },
    });
  }

  return { status: true, message: "registration is successfully" };
}

export async function deleteStudent(id: string): Promise<MutationState> {
  return { status: false, message: "deletion is not allowed" };
}

export async function getStudentList(search: string = "") {
  const data = await prisma.user.findMany({
    where: {
      role: "student",
      status: { in: ["active", "inactive"] },
      OR: [
        { firstName: { contains: search } },
        { fatherName: { contains: search } },
        { lastName: { contains: search } },
      ],
    },
    select: { id: true, firstName: true, fatherName: true, lastName: true },
  });

  return data;
}

export async function getStudents({ search, currentPage, row, sort, status }: Filter) {
  const session = await auth();
  const list = await prisma.user
    .findMany({
      where: {
        role: "student",
        ...(status ? { status: status as any } : {}),
        OR: [
          { firstName: { contains: search } },
          { fatherName: { contains: search } },
          { lastName: { contains: search } },
          { country: { contains: search } },
        ],
        ...(session?.user?.role === "controller"
          ? { controllerId: session.user.id }
          : {}),
      },
      skip: (currentPage - 1) * row,
      take: row,
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        phoneNumber: true,
        status: true,
        roomStudent: {
          select: {
            id: true,
            time: true,
            duration: true,
            link: true,
            updated: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
          take: 1,
        },
      },
    })
    .then(async (res) => {
      // Calculate day boundaries in UTC for Ethiopia timezone (UTC+3)
      // Ethiopia midnight (00:00 UTC+3) = 21:00 UTC previous day
      const now = new Date();
      const utcOffset = 3; // Ethiopia is UTC+3
      const startDay = new Date(now);
      startDay.setUTCHours(-utcOffset, 0, 0, 0); // Start of day in Ethiopia = previous day 21:00 UTC
      const endDay = new Date(now);
      endDay.setUTCHours(23 - utcOffset, 59, 59, 999); // End of day in Ethiopia = 20:59 UTC
      return await Promise.all(
        res.map(async ({ roomStudent, ...v }) => {
          if (!roomStudent[0]) {
            return { ...v, roomStudent: null };
          }
          const studentAttendance = await prisma.roomAttendance
            .findFirst({
              where: {
                userId: v.id,
                roomId: roomStudent[0]?.id ?? "none",
                date: { gte: startDay, lte: endDay },
              },
              select: { date: true },
            })
            .then((res) =>
              res?.date ? getLocalDate(res.date).toTimeString().slice(0, 8) : ""
            );
          const teacherAttendance = await prisma.roomAttendance
            .findFirst({
              where: {
                userId: roomStudent[0]?.teacher.id ?? "none",
                roomId: roomStudent[0]?.id ?? "none",
                date: { gte: startDay, lte: endDay },
              },
              select: { date: true },
            })
            .then((res) =>
              res?.date ? getLocalDate(res.date).toTimeString().slice(0, 8) : ""
            );

          return {
            ...v,
            roomStudent: {
              ...roomStudent[0],
              link:
                Date.now() - roomStudent[0].updated.getTime() < 40 * 60 * 1000
                  ? roomStudent[0].link
                  : "",
              studentAttendance,
              teacherAttendance,
            },
          };
        })
      );
    })
    // .then((res) =>
    //   res.sort((a, b) =>
    //     sorting(
    //       `${a.firstName} ${a.fatherName} ${a.lastName}`,
    //       `${b.firstName} ${b.fatherName} ${b.lastName}`,
    //       sort
    //     )
    //   )
    // )
    .then((res) =>
      res.sort((a, b) =>
        sorting(
          a.roomStudent?.time ?? "zzzzzz",
          b.roomStudent?.time ?? "zzzzzzzzzz",
          sort
        )
      )
    );

  const totalData = await prisma.user.count({
    where: {
      role: "student",
      ...(status ? { status: status as any } : {}),
      OR: [
        { firstName: { contains: search } },
        { fatherName: { contains: search } },
        { lastName: { contains: search } },
        { country: { contains: search } },
      ],
    },
  });

  return { list, totalData };
}

export async function getStudent(id: string) {
  const data = await prisma.user
    .findFirst({
      where: { id },
      include: {
        controller: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
          },
        },
        roomStudent: {
          select: {
            id: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
            time: true,
            duration: true,
            link: true,
            updated: true,
          },
        },
      },
    })
    .then((res) => {
      return res
        ? {
            ...res,
            room: res.roomStudent
              .map((v) => ({
                ...v,
                link:
                  Date.now() - v.updated.getTime() < 40 * 60 * 1000
                    ? v.link
                    : "",
              }))
              .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0)),
          }
        : null;
    });

  return data;
}
