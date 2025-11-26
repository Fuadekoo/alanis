"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getTeacherList(search: string = "") {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return [];
  }

  const teachers = await prisma.user.findMany({
    where: {
      role: "teacher",
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { fatherName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      fatherName: true,
      lastName: true,
      username: true,
    },
    orderBy: { firstName: "asc" },
  });

  return teachers;
}

