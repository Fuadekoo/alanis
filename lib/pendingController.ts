import { Prisma } from "@prisma/client";

type RawClient = Prisma.TransactionClient | Prisma.DefaultPrismaClient;

export function isMissingPendingControllerColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes("42703") && message.includes("pendingControllerId");
}

export async function setPendingControllerId(
  client: RawClient,
  studentId: string,
  pendingControllerId: string | null
) {
  try {
    await client.$executeRaw`
      UPDATE "user"
      SET "pendingControllerId" = ${pendingControllerId}
      WHERE "id" = ${studentId}
    `;

    return true;
  } catch (error) {
    if (isMissingPendingControllerColumnError(error)) {
      return false;
    }

    throw error;
  }
}

export async function getPendingStudentIdsForController(
  client: RawClient,
  controllerId: string
) {
  try {
    const rows = await client.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "user"
      WHERE "pendingControllerId" = ${controllerId}
    `;

    return rows.map((row) => row.id);
  } catch (error) {
    if (isMissingPendingControllerColumnError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getStudentPendingController(
  client: RawClient,
  studentId: string
) {
  try {
    const rows = await client.$queryRaw<
      Array<{
        pendingControllerId: string | null;
        id: string | null;
        firstName: string | null;
        fatherName: string | null;
        lastName: string | null;
      }>
    >`
      SELECT
        u."pendingControllerId",
        pc."id",
        pc."firstName",
        pc."fatherName",
        pc."lastName"
      FROM "user" u
      LEFT JOIN "user" pc
        ON pc."id" = u."pendingControllerId"
      WHERE u."id" = ${studentId}
      LIMIT 1
    `;

    const row = rows[0];

    if (!row) {
      return {
        pendingControllerId: null,
        pendingController: null,
      };
    }

    return {
      pendingControllerId: row.pendingControllerId,
      pendingController: row.id
        ? {
            id: row.id,
            firstName: row.firstName ?? "",
            fatherName: row.fatherName ?? "",
            lastName: row.lastName ?? "",
          }
        : null,
    };
  } catch (error) {
    if (isMissingPendingControllerColumnError(error)) {
      return {
        pendingControllerId: null,
        pendingController: null,
      };
    }

    throw error;
  }
}

export async function getStudentPendingControllerState(
  client: RawClient,
  studentId: string
) {
  try {
    const rows = await client.$queryRaw<
      Array<{
        id: string;
        controllerId: string | null;
        pendingControllerId: string | null;
      }>
    >`
      SELECT "id", "controllerId", "pendingControllerId"
      FROM "user"
      WHERE "id" = ${studentId}
      LIMIT 1
    `;

    return rows[0] ?? null;
  } catch (error) {
    if (isMissingPendingControllerColumnError(error)) {
      const rows = await client.$queryRaw<
        Array<{
          id: string;
          controllerId: string | null;
        }>
      >`
        SELECT "id", "controllerId"
        FROM "user"
        WHERE "id" = ${studentId}
        LIMIT 1
      `;

      const row = rows[0];

      return row
        ? {
            ...row,
            pendingControllerId: null,
          }
        : null;
    }

    throw error;
  }
}
