"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { paymentStatus } from "@prisma/client";

// Validate inputs (simple runtime checks)
const createSalaryInputSchema = z.object({
  teacherId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  unitPrice: z.number().nonnegative(),
  teacherProgressIds: z.array(z.string()).optional(),
  shiftTeacherDataIds: z.array(z.string()).optional(),
});

export async function getSalary() {
  // return a list of salaries (include relations as needed)
  return prisma.teacherSalary.findMany({
    // ...adjust include as your schema requires...
    orderBy: { createdAt: "desc" },
  });
}

export async function createSalary(
  teacherId: string,
  month: number,
  year: number,
  unitPrice: number,
  teacherProgressIds: string[] = [],
  shiftTeacherDataIds: string[] = []
) {
  // validate input
  createSalaryInputSchema.parse({
    teacherId,
    month,
    year,
    unitPrice,
    teacherProgressIds,
    shiftTeacherDataIds,
  });

  // require auth
  const user = await auth();
  if (!user) throw new Error("Unauthorized");

  // must select at least one source (teacherProgress or shiftTeacherData)
  if (
    (!teacherProgressIds || teacherProgressIds.length === 0) &&
    (!shiftTeacherDataIds || shiftTeacherDataIds.length === 0)
  ) {
    throw new Error(
      "At least one of teacherProgressIds or shiftTeacherDataIds must be provided."
    );
  }

  // Use a transaction to ensure all changes happen together
  const result = await prisma.$transaction(async (tx) => {
    let totalDayForLearning = 0;

    // Sum learningCount from teacherProgress entries if provided
    if (teacherProgressIds && teacherProgressIds.length > 0) {
      const tProgress = await tx.teacherProgress.findMany({
        where: { id: { in: teacherProgressIds } },
        select: { learningCount: true },
      });
      const sumProgress = tProgress.reduce(
        (s, p) => s + (p.learningCount ?? 0),
        0
      );
      totalDayForLearning += sumProgress;
    }

    // Sum learningCount from shiftTeacherData entries if provided
    if (shiftTeacherDataIds && shiftTeacherDataIds.length > 0) {
      const sData = await tx.shiftTeacherData.findMany({
        where: { id: { in: shiftTeacherDataIds } },
        select: { learningCount: true },
      });
      const sumShift = sData.reduce((s, p) => s + (p.learningCount ?? 0), 0);
      totalDayForLearning += sumShift;
    }

    // compute amount
    const amount = totalDayForLearning * unitPrice;

    // create teacherSalary record
    const teacherSalary = await tx.teacherSalary.create({
      data: {
        teacherId,
        month,
        year,
        totalDayForLearning,
        unitPrice,
        amount,
        // default status - adjust field name if your schema differs
        status: paymentStatus.PENDING,
        // optionally link source ids if you keep relation tables; adjust fields as needed:
        // teacherProgress: { connect: teacherProgressIds.map(id => ({ id })) },
        // shiftTeacherData: { connect: shiftTeacherDataIds.map(id => ({ id })) },
      },
    });

    // update ShiftTeacherData: set paymentStatus = APPROVED and progressStatus = "CLOSE"
    if (shiftTeacherDataIds && shiftTeacherDataIds.length > 0) {
      await tx.shiftTeacherData.updateMany({
        where: { id: { in: shiftTeacherDataIds } },
        data: {
          paymentStatus: paymentStatus.APPROVED,
          // progressStatus enum name/value may differ in your schema; adjust if necessary
          progressStatus: "CLOSE" as any,
        },
      });
    }

    // update TeacherProgress: set progressStatus = "CLOSE"
    if (teacherProgressIds && teacherProgressIds.length > 0) {
      await tx.teacherProgress.updateMany({
        where: { id: { in: teacherProgressIds } },
        data: {
          // progressStatus enum name/value may differ in your schema; adjust if necessary
          progressStatus: "CLOSE" as any,
        },
      });
    }

    return teacherSalary;
  });

  return result;
}

export async function updateSalary(salaryId: string, status: paymentStatus) {
  // simple status update for a salary -> teacherSalary
  return prisma.teacherSalary.update({
    where: { id: salaryId },
    data: { status },
  });
}

export async function deleteSalary(salaryId: string) {
  // delete salary by id -> teacherSalary
  return prisma.teacherSalary.delete({
    where: { id: salaryId },
  });
}
