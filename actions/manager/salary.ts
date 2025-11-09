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
      teacherProgresses: {
        select: {
          id: true,
          learningCount: true,
          missingCount: true,
          totalCount: true,
          paymentStatus: true,
          createdAt: true,
          student: {
            select: {
              firstName: true,
              fatherName: true,
              lastName: true,
            },
          },
        },
      },
      shiftTeacherData: {
        select: {
          id: true,
          learningCount: true,
          missingCount: true,
          totalCount: true,
          paymentStatus: true,
          createdAt: true,
          student: {
            select: {
              firstName: true,
              fatherName: true,
              lastName: true,
            },
          },
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
        select: { learningCount: true, totalCount: true },
      });
      const sumShift = sData.reduce((sum, record) => {
        if (typeof record.learningCount === "number") {
          return sum + record.learningCount;
        }
        if (typeof record.totalCount === "number") {
          return sum + record.totalCount;
        }
        return sum;
      }, 0);
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

    // update ShiftTeacherData: link to salary and keep pending until approval
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

    // update TeacherProgress: link to salary and mark closed, leave payment pending
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

const autoSalarySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  unitPrice: z.number().nonnegative(),
});

export async function createAutomaticSalaries(
  month: number,
  year: number,
  unitPrice: number
) {
  autoSalarySchema.parse({ month, year, unitPrice });

  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const roundedUnitPrice = Math.round(unitPrice);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const teacherProgressRecords = await tx.teacherProgress.findMany({
        where: {
          paymentStatus: paymentStatus.pending,
          progressStatus: progressStatus.open,
          teacherSalaryId: null,
        },
        select: {
          id: true,
          teacherId: true,
          studentId: true,
          learningCount: true,
          missingCount: true,
          totalCount: true,
        },
      });

      const shiftRecords = await tx.shiftTeacherData.findMany({
        where: {
          paymentStatus: paymentStatus.pending,
          teacherSalaryId: null,
        },
        select: {
          id: true,
          teacherId: true,
          studentId: true,
          learningCount: true,
          missingCount: true,
          totalCount: true,
        },
      });

      const grouped = new Map<
        string,
        Map<
          string,
          {
            progressIds: string[];
            shiftIds: string[];
            progressLearning: number;
            shiftLearning: number;
          }
        >
      >();

      const ensureGroup = (teacherId: string, studentId: string) => {
        if (!grouped.has(teacherId)) {
          grouped.set(teacherId, new Map());
        }
        const studentMap = grouped.get(teacherId)!;
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            progressIds: [],
            shiftIds: [],
            progressLearning: 0,
            shiftLearning: 0,
          });
        }
        return studentMap.get(studentId)!;
      };

      teacherProgressRecords.forEach((progress) => {
        const group = ensureGroup(progress.teacherId, progress.studentId);
        group.progressIds.push(progress.id);
        const learning =
          typeof progress.learningCount === "number"
            ? progress.learningCount
            : progress.totalCount ?? 0;
        group.progressLearning += learning;
      });

      shiftRecords.forEach((shift) => {
        const group = ensureGroup(shift.teacherId, shift.studentId);
        group.shiftIds.push(shift.id);
        const learning =
          typeof shift.learningCount === "number"
            ? shift.learningCount
            : shift.totalCount ?? 0;
        group.shiftLearning += learning;
      });

      if (grouped.size === 0) {
        return {
          success: false,
          message:
            "No pending teacher progress or shift history found for the selected month/year.",
          created: [],
          skipped: [],
        };
      }

      const teacherIds = Array.from(grouped.keys());

      const existingSalaries = await tx.teacherSalary.findMany({
        where: {
          teacherId: { in: teacherIds },
          month,
          year,
        },
        select: {
          teacherId: true,
        },
      });

      const existingMap = new Set(
        existingSalaries.map((item) => item.teacherId)
      );

      const teacherInfo = await tx.user.findMany({
        where: { id: { in: teacherIds } },
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          lastName: true,
        },
      });

      const teacherMap = new Map(teacherInfo.map((info) => [info.id, info]));

      const created: Array<{
        salaryId: string;
        teacherId: string;
        teacherName: string;
        totalDays: number;
        amount: number;
        progressCount: number;
        shiftCount: number;
        progressLearning?: number;
        shiftLearning?: number;
      }> = [];

      const skipped: Array<{ teacherId: string; reason: string }> = [];

      for (const [teacherId, studentMap] of grouped.entries()) {
        if (existingMap.has(teacherId)) {
          skipped.push({ teacherId, reason: "existing-salary" });
          continue;
        }

        let totalDays = 0;
        studentMap.forEach((entry) => {
          totalDays += entry.progressLearning + entry.shiftLearning;
        });

        if (totalDays <= 0) {
          skipped.push({ teacherId, reason: "no-learning-days" });
          continue;
        }

        const amount = totalDays * roundedUnitPrice;

        const salary = await tx.teacherSalary.create({
          data: {
            teacherId,
            month,
            year,
            unitPrice: roundedUnitPrice,
            totalDayForLearning: totalDays,
            amount,
            status: paymentStatus.pending,
          },
        });

        const allProgressIds: string[] = [];
        const allShiftIds: string[] = [];
        let progressLearning = 0;
        let shiftLearning = 0;

        studentMap.forEach((entry) => {
          allProgressIds.push(...entry.progressIds);
          allShiftIds.push(...entry.shiftIds);
          progressLearning += entry.progressLearning;
          shiftLearning += entry.shiftLearning;
        });

        if (allProgressIds.length > 0) {
          await tx.teacherProgress.updateMany({
            where: { id: { in: allProgressIds } },
            data: {
              teacherSalaryId: salary.id,
              progressStatus: progressStatus.closed,
              paymentStatus: paymentStatus.approved,
            },
          });
        }

        if (allShiftIds.length > 0) {
          await tx.shiftTeacherData.updateMany({
            where: { id: { in: allShiftIds } },
            data: {
              teacherSalaryId: salary.id,
              paymentStatus: paymentStatus.approved,
            },
          });
        }

        const teacher = teacherMap.get(teacherId);
        created.push({
          salaryId: salary.id,
          teacherId,
          teacherName: teacher
            ? `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`
            : teacherId,
          totalDays,
          amount,
          progressCount: allProgressIds.length,
          shiftCount: allShiftIds.length,
          progressLearning,
          shiftLearning,
        });
      }

      return {
        success: created.length > 0,
        message:
          created.length > 0
            ? "Automatic salaries generated successfully."
            : "No salaries were generated for the selected month/year.",
        created,
        skipped,
      };
    });

    return result;
  } catch (error) {
    console.error("Automatic salary generation failed", error);
    return {
      success: false,
      message: "Failed to generate automatic salaries.",
      created: [],
      skipped: [],
    };
  }
}

export async function updateSalary(
  salaryId: string,
  status: paymentStatus,
  paymentPhoto?: string
) {
  return prisma.$transaction(async (tx) => {
    const updateData: { status: paymentStatus; paymentPhoto?: string } = {
      status,
    };

    if (status === paymentStatus.approved && paymentPhoto) {
      updateData.paymentPhoto = paymentPhoto;
    }

    if (status === paymentStatus.rejected) {
      delete updateData.paymentPhoto;
    }

    const salary = await tx.teacherSalary.update({
      where: { id: salaryId },
      data: updateData,
    });

    if (status === paymentStatus.approved) {
      await tx.teacherProgress.updateMany({
        where: { teacherSalaryId: salaryId },
        data: {
          paymentStatus: paymentStatus.approved,
          progressStatus: progressStatus.closed,
        },
      });

      await tx.shiftTeacherData.updateMany({
        where: { teacherSalaryId: salaryId },
        data: {
          paymentStatus: paymentStatus.approved,
        },
      });
    }

    if (status === paymentStatus.rejected) {
      await tx.teacherProgress.updateMany({
        where: { teacherSalaryId: salaryId },
        data: {
          paymentStatus: paymentStatus.pending,
          progressStatus: progressStatus.open,
          teacherSalaryId: null,
        },
      });

      await tx.shiftTeacherData.updateMany({
        where: { teacherSalaryId: salaryId },
        data: {
          paymentStatus: paymentStatus.pending,
          teacherSalaryId: null,
        },
      });
    }

    return salary;
  });
}

export async function deleteSalary(salaryId: string) {
  // delete salary by id -> teacherSalary
  return prisma.teacherSalary.delete({
    where: { id: salaryId },
  });
}
