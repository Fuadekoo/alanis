"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { paymentStatus } from "@prisma/client";
import { progressStatus } from "@prisma/client";

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
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSalaryDetail(salaryId: string) {
  if (!salaryId) {
    return null;
  }

  return prisma.teacherSalary.findUnique({
    where: { id: salaryId },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
        },
      },
      teacherProgresses: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              fatherName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      shiftTeacherData: {
        include: {
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
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getTeacherProgressForSalary(teacherId: string) {
  // Get TeacherProgress records that are open and pending payment
  return prisma.teacherProgress.findMany({
    where: {
      teacherId,
      progressStatus: "open",
      paymentStatus: "pending",
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getShiftTeacherDataForSalary(teacherId: string) {
  // Get ShiftTeacherData records that are pending payment
  return prisma.shiftTeacherData.findMany({
    where: {
      teacherId,
      paymentStatus: "pending",
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
        },
      },
    },
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
        status: paymentStatus.pending,
      },
    });

    // update ShiftTeacherData: set paymentStatus = APPROVED, progressStatus = "CLOSED", and link to salary
    if (shiftTeacherDataIds && shiftTeacherDataIds.length > 0) {
      await tx.shiftTeacherData.updateMany({
        where: { id: { in: shiftTeacherDataIds } },
        data: {
          paymentStatus: paymentStatus.approved,
          progressStatus: progressStatus.closed,
          teacherSalaryId: teacherSalary.id,
        },
      });
    }

    // update TeacherProgress: set paymentStatus = APPROVED, progressStatus = "CLOSED" and link to salary
    if (teacherProgressIds && teacherProgressIds.length > 0) {
      await tx.teacherProgress.updateMany({
        where: { id: { in: teacherProgressIds } },
        data: {
          paymentStatus: paymentStatus.approved,
          progressStatus: progressStatus.closed,
          teacherSalaryId: teacherSalary.id,
        },
      });
    }

    return teacherSalary;
  });

  return result;
}

export async function updateSalary(
  salaryId: string,
  status: paymentStatus,
  paymentPhoto?: string
) {
  // simple status update for a salary -> teacherSalary
  const updateData: { status: paymentStatus; paymentPhoto?: string } = {
    status,
  };

  if (paymentPhoto) {
    updateData.paymentPhoto = paymentPhoto;
  }

  return prisma.teacherSalary.update({
    where: { id: salaryId },
    data: updateData,
  });
}

export async function deleteSalary(salaryId: string) {
  // delete salary by id -> teacherSalary
  return prisma.teacherSalary.delete({
    where: { id: salaryId },
  });
}
