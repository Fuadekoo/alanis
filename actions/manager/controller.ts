"use server";

import prisma from "@/lib/db";
import { Filter } from "@/lib/definitions";
import {
  ensureOpenControllerAssignmentHistory,
  isMissingAssignmentHistoryTableError,
} from "@/lib/assignmentHistory";
import { setPendingControllerId } from "@/lib/pendingController";
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

  if (!data) {
    return null;
  }

  let lastStudents: Array<{
    id: string;
    assignedAt: Date;
    detachedAt: Date | null;
    studentId: string;
    studentFirstName: string;
    studentFatherName: string;
    studentLastName: string;
  }> = [];

  try {
    lastStudents = await prisma.$queryRaw<
      Array<{
        id: string;
        assignedAt: Date;
        detachedAt: Date | null;
        studentId: string;
        studentFirstName: string;
        studentFatherName: string;
        studentLastName: string;
      }>
    >`
      SELECT
        cah."id",
        cah."assignedAt",
        cah."detachedAt",
        u."id" AS "studentId",
        u."firstName" AS "studentFirstName",
        u."fatherName" AS "studentFatherName",
        u."lastName" AS "studentLastName"
      FROM "controller_assignment_history" cah
      INNER JOIN "user" u
        ON u."id" = cah."studentId"
      WHERE cah."controllerId" = ${id}
        AND cah."detachedAt" IS NOT NULL
      ORDER BY cah."detachedAt" DESC, cah."assignedAt" DESC
    `;
  } catch (error) {
    if (
      !isMissingAssignmentHistoryTableError(
        error,
        "controller_assignment_history"
      )
    ) {
      throw error;
    }
  }

  return {
    ...data,
    lastStudents: lastStudents.map((item) => ({
      id: item.id,
      assignedAt: item.assignedAt,
      detachedAt: item.detachedAt,
      student: {
        id: item.studentId,
        firstName: item.studentFirstName,
        fatherName: item.studentFatherName,
        lastName: item.studentLastName,
      },
    })),
  };
}

export async function assignController({
  controllerId,
  id,
}: AssignControllerSchema) {
  let message = "successfully assign controller";

  await prisma.$transaction(async (tx) => {
    const student = await tx.user.findFirst({
      where: { id, role: "student" },
      select: { id: true, controllerId: true },
    });

    if (!student) {
      throw new Error("student not found");
    }

    if (student.controllerId) {
      await ensureOpenControllerAssignmentHistory(tx, {
        studentId: student.id,
        controllerId: student.controllerId,
      });
    }

    const controllerChangeRequested =
      !!student.controllerId && student.controllerId !== controllerId;

    if (controllerChangeRequested) {
      const supported = await setPendingControllerId(tx, student.id, controllerId);

      if (!supported) {
        throw new Error(
          "pending controller migration is missing. run prisma migration first"
        );
      }
    } else {
      await tx.user.update({
        where: { id: student.id },
        data: { controllerId },
      });
      await setPendingControllerId(tx, student.id, null);
    }

    if (!student.controllerId) {
      await ensureOpenControllerAssignmentHistory(tx, {
        studentId: student.id,
        controllerId,
      });
    }

    if (controllerChangeRequested) {
      message = "controller change is waiting for the new controller to accept";
    }
  });

  return { status: true, message };
}
