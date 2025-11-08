"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function getTeacherSalaries(
  year?: number,
  month?: number,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const where: {
      teacherId: string;
      year?: number;
      month?: number;
    } = {
      teacherId: session.user.id,
    };

    if (year && year >= 2000) {
      where.year = year;
    }

    if (month && month >= 1 && month <= 12) {
      where.month = month;
    }

    const skip = (page - 1) * pageSize;

    const [salaries, totalCount] = await Promise.all([
      prisma.teacherSalary.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.teacherSalary.count({ where }),
    ]);

    return {
      success: true,
      data: {
        salaries,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher salaries:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load salaries",
    };
  }
}

export async function getTeacherSalaryDetail(salaryId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const salary = await prisma.teacherSalary.findFirst({
      where: {
        id: salaryId,
        teacherId: session.user.id,
      },
      include: {
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
    });

    if (!salary) {
      throw new Error("Salary not found");
    }

    return {
      success: true,
      data: salary,
    };
  } catch (error) {
    console.error("Error fetching salary detail:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load salary detail",
    };
  }
}
