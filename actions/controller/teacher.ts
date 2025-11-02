"use server";

import { Filter, MutationState } from "@/lib/definitions";
import { getLocalDate, sorting } from "@/lib/utils";
import { TeacherSchema } from "@/lib/zodSchema";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function registerTeacher({
  id,
  password,
  ...data
}: TeacherSchema): Promise<MutationState> {
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
        ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
      },
    });
  } else {
    await prisma.user.create({
      data: {
        role: "teacher",
        firstName: data.firstName,
        fatherName: data.fatherName,
        lastName: data.lastName,
        gender: data.gender,
        age: +data.age,
        phoneNumber: data.phoneNumber,
        country: data.country,
        username: data.username,
        password: await bcrypt.hash(password, 12),
      },
    });
  }

  return { status: true, message: "successfully register the teacher" };
}

export async function deleteTeacher(id: string): Promise<MutationState> {
  await prisma.user.deleteMany({ where: { id } });

  return { status: true, message: "successfully delete teacher" };
}

export async function getTeacherList() {
  const data = await prisma.user.findMany({
    where: { role: "teacher" },
    select: { id: true, firstName: true, fatherName: true, lastName: true },
  });

  return data;
}

export async function getTeachers({ search, currentPage, row, sort }: Filter) {
  const session = await auth();

  // Base where clause for teachers
  const whereClause = {
    role: "teacher" as const,
    OR: [
      { firstName: { contains: search } },
      { fatherName: { contains: search } },
      { lastName: { contains: search } },
      { country: { contains: search } },
    ],
  };

  const list = await prisma.user
    .findMany({
      where: whereClause,
      skip: (currentPage - 1) * row,
      take: row,
      select: { id: true, firstName: true, fatherName: true, lastName: true },
    })
    .then((res) =>
      res.sort((a, b) =>
        sorting(
          `${a.firstName} ${a.fatherName} ${a.lastName}`,
          `${b.firstName} ${b.fatherName} ${b.lastName}`,
          sort
        )
      )
    );

  const totalData = await prisma.user.count({
    where: whereClause,
  });

  return { list, totalData };
}

export async function getTeacher(id: string) {
  const data = await prisma.user
    .findFirst({
      where: { id, role: "teacher" },
      include: {
        roomTeacher: {
          select: {
            id: true,
            student: {
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
            room: res.roomTeacher
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

export async function getRoomAttendance(
  userId: string,
  year: number,
  month: number
) {
  // const temp = [
  //   [new Date().toLocaleDateString(), 5],
  //   [new Date().toLocaleDateString(), 5],
  //   [new Date().toLocaleDateString(), 5],
  //   [new Date().toLocaleDateString(), 5],
  // ] as const;
  // return temp;

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month, new Date(year, month + 1, 0).getDate());

  const data = await prisma.roomAttendance
    .findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: { select: { id: true } },
        room: {
          select: {
            student: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })
    .then(async (res) => {
      const result = Object.entries(
        await res.reduce(
          async (acc, cc) => {
            const startDay = new Date(cc.date.toISOString());
            startDay.setHours(0);
            startDay.setMinutes(0);
            const endDay = new Date(cc.date.toISOString());
            endDay.setHours(23);
            endDay.setMinutes(59);

            let other = "";
            if (cc.user.id == cc.room.student.id) {
              const temp = await prisma.roomAttendance.findFirst({
                where: {
                  userId: cc.room.teacher.id,
                  roomId: cc.roomId,
                  date: {
                    gte: startDay,
                    lte: endDay,
                  },
                },
              });
              if (temp?.date)
                other = getLocalDate(temp.date).toTimeString().slice(0, 8);
            } else {
              const temp = await prisma.roomAttendance.findFirst({
                where: {
                  userId: cc.room.student.id,
                  roomId: cc.roomId,
                  date: {
                    gte: startDay,
                    lte: endDay,
                  },
                },
              });
              if (temp?.date)
                other = getLocalDate(temp.date).toTimeString().slice(0, 8);
            }

            return {
              ...(await acc),
              [cc.date.toLocaleDateString()]: {
                count:
                  ((await acc)[cc.date.toLocaleDateString()]?.count ?? 0) + 1,
                room: [
                  ...((await acc)[cc.date.toLocaleDateString()]?.room ?? []),
                  {
                    user:
                      cc.user.id == cc.room.student.id
                        ? cc.room.teacher
                        : cc.room.student,
                    time: getLocalDate(cc.date).toTimeString().slice(0, 8),
                    other,
                  },
                ],
              },
            };
          },
          {} as Promise<
            Record<
              string,
              {
                room: {
                  user: {
                    firstName: string;
                    fatherName: string;
                    lastName: string;
                  };
                  time: string;
                  other: string;
                }[];
                count: number;
              }
            >
          >
        )
      );

      return result;
    });

  return data;
}
