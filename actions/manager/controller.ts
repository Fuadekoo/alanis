"use server";

import prisma from "@/lib/db";
import { Filter } from "@/lib/definitions";
import { sorting } from "@/lib/utils";
import { AssignControllerSchema, ControllerSchema } from "@/lib/zodSchema";
import bcrypt from "bcryptjs";

export async function registerController({
  id,
  password,
  ...data
}: ControllerSchema) {
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
        role: "controller",
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

  return { status: true, message: "successfully register controller" };
}

export async function deleteController(id: string) {
  await prisma.user.deleteMany({ where: { id } });

  return { status: true, message: "successfully delete controller" };
}

export async function getControllerList() {
  const data = await prisma.user.findMany({
    where: { role: "controller" },
    select: { id: true, firstName: true, fatherName: true, lastName: true },
  });

  return data;
}

export async function getControllers({
  search,
  currentPage,
  row,
  sort,
}: Filter) {
  const list = await prisma.user
    .findMany({
      where: {
        role: "controller",
        OR: [
          { firstName: { contains: search } },
          { fatherName: { contains: search } },
          { lastName: { contains: search } },
          { country: { contains: search } },
        ],
      },
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
    where: {
      role: "controller",
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

export async function getController(id: string) {
  const data = await prisma.user.findFirst({
    where: { id, role: "controller" },
    include: {
      students: {
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
          controllerId: true,
        },
      },
    },
  });

  return data;
}

export async function assignController({
  controllerId,
  id,
}: AssignControllerSchema) {
  await prisma.user.update({
    where: { id, role: "student" },
    data: { controllerId },
  });

  return { status: true, message: "successfully assign controller" };
}
