"use server";

import prisma from "@/lib/db";
import { Filter } from "@/lib/definitions";
import { sorting } from "@/lib/utils";

export async function approvedNewStudent(id: string) {
  try {
    await prisma.user.update({ where: { id }, data: { status: "active" } });
    return { status: true, message: "successfully approved new student" };
  } catch {
    return { status: false, message: "failed to approved new student" };
  }
}

export async function deleteNewStudent(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    return { status: true, message: "successfully delete new student" };
  } catch {
    return { status: false, message: "failed to delete new student" };
  }
}

export async function getNewStudents({
  search,
  currentPage,
  row,
  sort,
}: Filter) {
  const list = await prisma.user
    .findMany({
      where: {
        role: "student",
        status: "new",
        OR: [
          { firstName: { contains: search } },
          { fatherName: { contains: search } },
          { lastName: { contains: search } },
          { country: { contains: search } },
        ],
      },
      skip: (currentPage - 1) * row,
      take: row,
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        country: true,
        phoneNumber: true,
      },
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
    where: {
      role: "student",
      status: "new",
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
