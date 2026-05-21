"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  buildSalaryDetailCollections,
  mapSalaryToRow,
  teacherSelect,
} from "@/actions/shared/teacherDomain";

async function requireTeacherId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "teacher") {
    throw new Error("Access denied");
  }

  return user.id;
}

export async function getTeacherSalaries(
  year?: number,
  month?: number,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const teacherId = await requireTeacherId();

    const where: {
      teacherId: string;
      year?: number;
      month?: number;
    } = { teacherId };

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
        include: {
          reports: {
            select: {
              attendance: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.teacherSalary.count({ where }),
    ]);

    return {
      success: true,
      data: {
        salaries: salaries.map(mapSalaryToRow),
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
    const teacherId = await requireTeacherId();

    const salary = await prisma.teacherSalary.findFirst({
      where: {
        id: salaryId,
        teacherId,
      },
      include: {
        teacher: {
          select: teacherSelect,
        },
        reports: {
          include: {
            combination: {
              include: {
                student: {
                  select: teacherSelect,
                },
                teacher: {
                  select: teacherSelect,
                },
              },
            },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!salary) {
      throw new Error("Salary not found");
    }

    const salaryRow = mapSalaryToRow(salary);
    const detailCollections = buildSalaryDetailCollections(salary);

    return {
      success: true,
      data: {
        ...salaryRow,
        teacherProgresses: detailCollections.teacherProgresses,
        shiftTeacherData: detailCollections.shiftTeacherData,
      },
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
