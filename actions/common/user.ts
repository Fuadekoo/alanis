"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { MutationState } from "@/lib/definitions";
import { RegisterSchema } from "@/lib/zodSchema";
import { userStatus } from "@prisma/client";

export async function changeUserStatus(
  id: string,
  status: string
): Promise<MutationState> {
  if (!Object.values(userStatus).includes(status as userStatus)) {
    return { status: false, message: "invalid user status" };
  }

  await prisma.user.update({
    where: { id },
    data: { status: status as userStatus },
  });

  return { status: true, message: "user status updated" };
}

export async function getUser() {
  const session = await auth();
  const data = await prisma.user.findFirst({
    where: { id: session?.user?.id },
    select: {
      firstName: true,
      fatherName: true,
      lastName: true,
      role: true,
    },
  });

  return data;
}

export async function register({ name, country, phoneNumber }: RegisterSchema) {
  try {
    const [firstName, fatherName, lastName] = name.split(" ");
    const user = await prisma.user.findFirst({
      where: { username: phoneNumber },
    });
    if (user) {
      return { status: false, message: "username is taken" };
    } else {
      await prisma.user.create({
        data: {
          role: "student",
          username: phoneNumber,
          firstName,
          fatherName,
          lastName,
          country,
          phoneNumber,
          status: "new",
        },
      });
    }
    return { status: true, message: "successfully registered" };
  } catch {
    return { status: false, message: "failed to register" };
  }
}
