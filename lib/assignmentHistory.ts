import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export function isMissingAssignmentHistoryTableError(
  error: unknown,
  tableName: string
) {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes("42P01") && message.includes(tableName);
}

export async function ensureOpenTeacherAssignmentHistory(
  tx: Tx,
  {
    studentId,
    teacherId,
    time,
    duration,
    assignedAt = new Date(),
  }: {
    studentId: string;
    teacherId: string;
    time: string;
    duration: number;
    assignedAt?: Date;
  }
) {
  const now = new Date();
  let existing: { id: string }[] = [];

  try {
    existing = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "teacher_assignment_history"
      WHERE "studentId" = ${studentId}
        AND "teacherId" = ${teacherId}
        AND "detachedAt" IS NULL
      ORDER BY "assignedAt" DESC
      LIMIT 1
    `;
  } catch (error) {
    if (isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")) {
      return null;
    }
    throw error;
  }

  if (existing[0]) {
    try {
      await tx.$executeRaw`
        UPDATE "teacher_assignment_history"
        SET "time" = ${time},
            "duration" = ${duration},
            "updatedAt" = ${now}
        WHERE "id" = ${existing[0].id}
      `;
    } catch (error) {
      if (isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")) {
        return null;
      }
      throw error;
    }
    return existing[0];
  }

  const id = randomUUID();

  try {
    await tx.$executeRaw`
      INSERT INTO "teacher_assignment_history" (
        "id",
        "studentId",
        "teacherId",
        "assignedAt",
        "detachedAt",
        "time",
        "duration",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${id},
        ${studentId},
        ${teacherId},
        ${assignedAt},
        NULL,
        ${time},
        ${duration},
        ${now},
        ${now}
      )
    `;
  } catch (error) {
    if (isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")) {
      return null;
    }
    throw error;
  }

  return { id };
}

export async function closeTeacherAssignmentHistory(
  tx: Tx,
  {
    studentId,
    teacherId,
    detachedAt = new Date(),
  }: {
    studentId: string;
    teacherId: string;
    detachedAt?: Date;
  }
) {
  let existing: { id: string }[] = [];

  try {
    existing = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "teacher_assignment_history"
      WHERE "studentId" = ${studentId}
        AND "teacherId" = ${teacherId}
        AND "detachedAt" IS NULL
      ORDER BY "assignedAt" DESC
      LIMIT 1
    `;
  } catch (error) {
    if (isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")) {
      return null;
    }
    throw error;
  }

  if (!existing[0]) return null;

  try {
    await tx.$executeRaw`
      UPDATE "teacher_assignment_history"
      SET "detachedAt" = ${detachedAt},
          "updatedAt" = ${detachedAt}
      WHERE "id" = ${existing[0].id}
    `;
  } catch (error) {
    if (isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")) {
      return null;
    }
    throw error;
  }

  return existing[0];
}

export async function ensureOpenControllerAssignmentHistory(
  tx: Tx,
  {
    studentId,
    controllerId,
    assignedAt = new Date(),
  }: {
    studentId: string;
    controllerId: string;
    assignedAt?: Date;
  }
) {
  const now = new Date();
  let existing: { id: string }[] = [];

  try {
    existing = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "controller_assignment_history"
      WHERE "studentId" = ${studentId}
        AND "controllerId" = ${controllerId}
        AND "detachedAt" IS NULL
      ORDER BY "assignedAt" DESC
      LIMIT 1
    `;
  } catch (error) {
    if (
      isMissingAssignmentHistoryTableError(
        error,
        "controller_assignment_history"
      )
    ) {
      return null;
    }
    throw error;
  }

  if (existing[0]) {
    try {
      await tx.$executeRaw`
        UPDATE "controller_assignment_history"
        SET "updatedAt" = ${now}
        WHERE "id" = ${existing[0].id}
      `;
    } catch (error) {
      if (
        isMissingAssignmentHistoryTableError(
          error,
          "controller_assignment_history"
        )
      ) {
        return null;
      }
      throw error;
    }
    return existing[0];
  }

  const id = randomUUID();

  try {
    await tx.$executeRaw`
      INSERT INTO "controller_assignment_history" (
        "id",
        "studentId",
        "controllerId",
        "assignedAt",
        "detachedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${id},
        ${studentId},
        ${controllerId},
        ${assignedAt},
        NULL,
        ${now},
        ${now}
      )
    `;
  } catch (error) {
    if (
      isMissingAssignmentHistoryTableError(
        error,
        "controller_assignment_history"
      )
    ) {
      return null;
    }
    throw error;
  }

  return { id };
}

export async function closeControllerAssignmentHistory(
  tx: Tx,
  {
    studentId,
    controllerId,
    detachedAt = new Date(),
  }: {
    studentId: string;
    controllerId: string;
    detachedAt?: Date;
  }
) {
  let existing: { id: string }[] = [];

  try {
    existing = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "controller_assignment_history"
      WHERE "studentId" = ${studentId}
        AND "controllerId" = ${controllerId}
        AND "detachedAt" IS NULL
      ORDER BY "assignedAt" DESC
      LIMIT 1
    `;
  } catch (error) {
    if (
      isMissingAssignmentHistoryTableError(
        error,
        "controller_assignment_history"
      )
    ) {
      return null;
    }
    throw error;
  }

  if (!existing[0]) return null;

  try {
    await tx.$executeRaw`
      UPDATE "controller_assignment_history"
      SET "detachedAt" = ${detachedAt},
          "updatedAt" = ${detachedAt}
      WHERE "id" = ${existing[0].id}
    `;
  } catch (error) {
    if (
      isMissingAssignmentHistoryTableError(
        error,
        "controller_assignment_history"
      )
    ) {
      return null;
    }
    throw error;
  }

  return existing[0];
}
