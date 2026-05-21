"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";
import {
  AttendanceStatus,
  Prisma,
  TeacherStudentStatus,
  paymentStatus,
} from "@prisma/client";
import {
  buildProgressRecord,
  buildSalaryDetailCollections,
  comboProgressInclude,
  createSalaryExpenseName,
  mapSalaryToRow,
  teacherSelect,
  toSalaryStatus,
} from "@/actions/shared/teacherDomain";

type ManagerSalaryStatus = paymentStatus | "approved" | "rejected" | "pending";

type ComboRecord = Prisma.TeacherStudentGetPayload<{
  include: typeof comboProgressInclude;
}>;

type SalaryRecord = Prisma.TeacherSalaryGetPayload<{
  include: {
    teacher: {
      select: typeof teacherSelect;
    };
    reports: {
      include: {
        combination: {
          include: {
            student: {
              select: typeof teacherSelect;
            };
            teacher: {
              select: typeof teacherSelect;
            };
          };
        };
      };
      orderBy: {
        date: "desc";
      };
    };
  };
}>;

function getSelectedComboIds(
  teacherProgressIds: string[] = [],
  shiftTeacherDataIds: string[] = [],
) {
  return Array.from(new Set([...teacherProgressIds, ...shiftTeacherDataIds]));
}

function getSalaryMonthBounds(month: number, year: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  return { startDate, endDate };
}

function isReportInSalaryPeriod(
  reportDate: Date,
  month?: number,
  year?: number,
) {
  if (!month || !year) {
    return true;
  }

  return (
    reportDate.getUTCFullYear() === year &&
    reportDate.getUTCMonth() + 1 === month
  );
}

function getPendingLearningReports(
  combo: ComboRecord,
  month?: number,
  year?: number,
) {
  return combo.dailyReports.filter(
    (report) =>
      report.attendance !== AttendanceStatus.ABSENT &&
      !report.salaryId &&
      isReportInSalaryPeriod(report.date, month, year),
  );
}

function getMonthlyReports(combo: ComboRecord, month?: number, year?: number) {
  return combo.dailyReports.filter((report) =>
    isReportInSalaryPeriod(report.date, month, year),
  );
}

function mapComboForSalary(combo: ComboRecord, month: number, year: number) {
  return buildProgressRecord({
    ...combo,
    dailyReports: getMonthlyReports(combo, month, year),
  });
}

function mapSalaryRowWithTeacher(salary: {
  id: string;
  teacher: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    phoneNumber: string;
    username: string;
  };
  month: number;
  year: number;
  baseSalary: Prisma.Decimal;
  bonus: Prisma.Decimal;
  deduction: Prisma.Decimal;
  dailyRate: Prisma.Decimal;
  totalSalary: Prisma.Decimal;
  status: import("@prisma/client").SalaryStatus;
  paymentPhoto: string | null;
  createdAt: Date;
  paidAt: Date | null;
  note: string | null;
  reports: Array<{
    attendance: AttendanceStatus;
  }>;
}) {
  return {
    ...mapSalaryToRow(salary),
    teacher: salary.teacher,
  };
}

async function getTeacherCombosForSalary(
  teacherId: string,
  month: number,
  year: number,
) {
  const { startDate, endDate } = getSalaryMonthBounds(month, year);

  return prisma.teacherStudent.findMany({
    where: {
      teacherId,
      dailyReports: {
        some: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
    },
    include: comboProgressInclude,
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });
}

async function createSalaryRecord(
  tx: Prisma.TransactionClient,
  {
    teacherId,
    month,
    year,
    unitPrice,
    baseSalary = 0,
    bonus = 0,
    deduction = 0,
    comboIds,
  }: {
    teacherId: string;
    month: number;
    year: number;
    unitPrice: number;
    baseSalary?: number;
    bonus?: number;
    deduction?: number;
    comboIds: string[];
  },
) {
  const teacher = await tx.user.findUnique({
    where: { id: teacherId },
    select: teacherSelect,
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const existingSalary = await tx.teacherSalary.findUnique({
    where: {
      teacherId_month_year: {
        teacherId,
        month,
        year,
      },
    },
    select: { id: true },
  });

  if (existingSalary) {
    throw new Error("Salary already exists for this teacher, month, and year");
  }

  const combos =
    comboIds.length > 0
      ? await tx.teacherStudent.findMany({
          where: {
            id: {
              in: comboIds,
            },
            teacherId,
          },
          include: comboProgressInclude,
        })
      : await tx.teacherStudent.findMany({
          where: {
            teacherId,
            dailyReports: {
              some: {
                salaryId: null,
                attendance: {
                  not: AttendanceStatus.ABSENT,
                },
                ...(() => {
                  const { startDate, endDate } = getSalaryMonthBounds(
                    month,
                    year,
                  );
                  return {
                    date: {
                      gte: startDate,
                      lt: endDate,
                    },
                  };
                })(),
              },
            },
          },
          include: comboProgressInclude,
        });

  if (combos.length === 0 && baseSalary <= 0) {
    throw new Error("No teacher records were selected and base salary is 0");
  }

  const pendingReports = combos.flatMap((combo) =>
    getPendingLearningReports(combo, month, year).map((report) => report.id),
  );

  const totalDayForLearning = pendingReports.length;
  const totalSalary = Number(
    (baseSalary + totalDayForLearning * unitPrice + bonus - deduction).toFixed(
      2,
    ),
  );

  const salary = await tx.teacherSalary.create({
    data: {
      teacherId,
      month,
      year,
      baseSalary: new Prisma.Decimal(baseSalary),
      bonus: new Prisma.Decimal(bonus),
      deduction: new Prisma.Decimal(deduction),
      dailyRate: new Prisma.Decimal(unitPrice),
      totalSalary: new Prisma.Decimal(totalSalary),
      status: toSalaryStatus("pending"),
    },
    include: {
      teacher: {
        select: teacherSelect,
      },
      reports: {
        select: {
          attendance: true,
        },
      },
    },
  });

  if (pendingReports.length > 0) {
    await tx.teacherDailyReport.updateMany({
      where: {
        id: {
          in: pendingReports,
        },
      },
      data: {
        salaryId: salary.id,
      },
    });
  }

  await tx.expense.create({
    data: {
      name: createSalaryExpenseName(teacher, month, year),
      amount: Math.round(totalSalary),
      date: salary.createdAt,
      teacherSalaryId: salary.id,
      status: paymentStatus.pending,
    },
  });

  return {
    ...mapSalaryRowWithTeacher({
      ...salary,
      reports: pendingReports.map(() => ({
        attendance: AttendanceStatus.PRESENT,
      })),
    }),
    teacher,
  };
}

export async function getSalary() {
  await isAuthorized("manager");

  const salaries = await prisma.teacherSalary.findMany({
    include: {
      teacher: {
        select: teacherSelect,
      },
      reports: {
        select: {
          attendance: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  return salaries.map(mapSalaryRowWithTeacher);
}

export async function getTeacherProgressForSalary(
  teacherId: string,
  month: number,
  year: number,
) {
  await isAuthorized("manager");

  if (!teacherId || !month || month < 1 || month > 12 || !year || year < 2000) {
    return [];
  }

  const combos = await getTeacherCombosForSalary(teacherId, month, year);

  return combos
    .filter(
      (combo) =>
        combo.active &&
        combo.status === TeacherStudentStatus.ACTIVE &&
        getPendingLearningReports(combo, month, year).length > 0,
    )
    .map((combo) => mapComboForSalary(combo, month, year));
}

export async function getShiftTeacherDataForSalary(
  teacherId: string,
  month: number,
  year: number,
) {
  await isAuthorized("manager");

  if (!teacherId || !month || month < 1 || month > 12 || !year || year < 2000) {
    return [];
  }

  const combos = await getTeacherCombosForSalary(teacherId, month, year);

  return combos
    .filter(
      (combo) =>
        (!combo.active || combo.status !== TeacherStudentStatus.ACTIVE) &&
        getPendingLearningReports(combo, month, year).length > 0,
    )
    .map((combo) => mapComboForSalary(combo, month, year));
}

export async function createSalary(
  teacherId: string,
  month: number,
  year: number,
  unitPrice: number,
  baseSalary: number = 0,
  bonus: number = 0,
  deduction: number = 0,
) {
  try {
    await isAuthorized("manager");

    if (!teacherId) {
      throw new Error("Teacher is required");
    }

    if (!month || month < 1 || month > 12) {
      throw new Error("Month must be between 1 and 12");
    }

    if (!year || year < 2000) {
      throw new Error("Year is invalid");
    }

    if (unitPrice < 0) {
      throw new Error("Unit price cannot be negative");
    }

    const salary = await prisma.$transaction((tx) =>
      createSalaryRecord(tx, {
        teacherId,
        month,
        year,
        unitPrice,
        baseSalary,
        bonus,
        deduction,
        comboIds: [],
      }),
    );

    return {
      success: true,
      data: salary,
      message: "Salary created successfully",
    };
  } catch (error) {
    console.error("Error creating salary:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create salary",
    };
  }
}

export async function createAutomaticSalaries(
  month: number,
  year: number,
  unitPrice: number,
) {
  try {
    await isAuthorized("manager");

    if (!month || month < 1 || month > 12) {
      throw new Error("Month must be between 1 and 12");
    }

    if (!year || year < 2000) {
      throw new Error("Year is invalid");
    }

    if (!unitPrice || unitPrice <= 0) {
      throw new Error("Unit price must be greater than zero");
    }

    const combos = await prisma.teacherStudent.findMany({
      where: {
        dailyReports: {
          some: {
            salaryId: null,
            attendance: {
              not: AttendanceStatus.ABSENT,
            },
            ...(() => {
              const { startDate, endDate } = getSalaryMonthBounds(month, year);
              return {
                date: {
                  gte: startDate,
                  lt: endDate,
                },
              };
            })(),
          },
        },
      },
      select: {
        id: true,
        teacherId: true,
      },
    });

    const teacherComboMap = new Map<string, string[]>();
    for (const combo of combos) {
      const current = teacherComboMap.get(combo.teacherId) ?? [];
      current.push(combo.id);
      teacherComboMap.set(combo.teacherId, current);
    }

    const created: Array<Awaited<ReturnType<typeof createSalaryRecord>>> = [];

    await prisma.$transaction(async (tx) => {
      for (const [teacherId, comboIds] of teacherComboMap.entries()) {
        const existingSalary = await tx.teacherSalary.findUnique({
          where: {
            teacherId_month_year: {
              teacherId,
              month,
              year,
            },
          },
          select: { id: true },
        });

        if (existingSalary) {
          continue;
        }

        const salary = await createSalaryRecord(tx, {
          teacherId,
          month,
          year,
          unitPrice,
          comboIds,
        });

        created.push(salary);
      }
    });

    return {
      success: true,
      created,
      message:
        created.length > 0
          ? "Automatic salaries created successfully"
          : "No salaries were generated for the selected period.",
    };
  } catch (error) {
    console.error("Error creating automatic salaries:", error);
    return {
      success: false,
      created: [],
      message:
        error instanceof Error
          ? error.message
          : "Failed to create automatic salaries",
    };
  }
}

export async function updateSalary(
  salaryId: string,
  status: ManagerSalaryStatus,
  paymentPhoto?: string,
) {
  await isAuthorized("manager");

  if (!salaryId) {
    throw new Error("Salary ID is required");
  }

  const nextStatus = toSalaryStatus(status);

  const salary = await prisma.teacherSalary.findUnique({
    where: { id: salaryId },
    include: {
      teacher: {
        select: teacherSelect,
      },
      reports: {
        select: {
          attendance: true,
        },
      },
    },
  });

  if (!salary) {
    throw new Error("Salary not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const teacherSalary = await tx.teacherSalary.update({
      where: { id: salaryId },
      data: {
        status: nextStatus,
        paymentPhoto:
          nextStatus === toSalaryStatus("approved")
            ? (paymentPhoto ?? salary.paymentPhoto)
            : salary.paymentPhoto,
        paidAt:
          nextStatus === toSalaryStatus("approved")
            ? new Date()
            : salary.paidAt,
      },
      include: {
        teacher: {
          select: teacherSelect,
        },
        reports: {
          select: {
            attendance: true,
          },
        },
      },
    });

    let nextExpenseStatus: paymentStatus = paymentStatus.pending;
    const normalizedStatus = String(status);
    if (normalizedStatus === paymentStatus.approved) {
      nextExpenseStatus = paymentStatus.approved;
    } else if (normalizedStatus === paymentStatus.rejected) {
      nextExpenseStatus = paymentStatus.rejected;
    }

    await tx.expense.updateMany({
      where: {
        teacherSalaryId: salaryId,
      },
      data: {
        status: nextExpenseStatus,
        paymentPhoto:
          nextExpenseStatus === paymentStatus.approved
            ? paymentPhoto
            : undefined,
      },
    });

    return teacherSalary;
  });

  return mapSalaryRowWithTeacher(updated);
}

export async function updateSalaryFinancials(
  salaryId: string,
  data: {
    baseSalary: number;
    bonus: number;
    deduction: number;
    unitPrice: number;
  },
) {
  await isAuthorized("manager");

  const salary = await prisma.teacherSalary.findUnique({
    where: { id: salaryId },
    include: {
      reports: {
        select: {
          attendance: true,
        },
      },
    },
  });

  if (!salary) {
    throw new Error("Salary not found");
  }

  const totalDayForLearning = salary.reports.filter(
    (r) => r.attendance !== AttendanceStatus.ABSENT,
  ).length;

  const totalSalary = Number(
    (
      data.baseSalary +
      totalDayForLearning * data.unitPrice +
      data.bonus -
      data.deduction
    ).toFixed(2),
  );

  const updated = await prisma.$transaction(async (tx) => {
    const teacherSalary = await tx.teacherSalary.update({
      where: { id: salaryId },
      data: {
        baseSalary: new Prisma.Decimal(data.baseSalary),
        bonus: new Prisma.Decimal(data.bonus),
        deduction: new Prisma.Decimal(data.deduction),
        dailyRate: new Prisma.Decimal(data.unitPrice),
        totalSalary: new Prisma.Decimal(totalSalary),
      },
      include: {
        teacher: {
          select: teacherSelect,
        },
        reports: {
          select: {
            attendance: true,
          },
        },
      },
    });

    await tx.expense.updateMany({
      where: { teacherSalaryId: salaryId },
      data: {
        amount: Math.round(totalSalary),
      },
    });

    return teacherSalary;
  });

  return mapSalaryRowWithTeacher(updated);
}

export async function deleteSalary(salaryId: string) {
  await isAuthorized("manager");

  const salary = await prisma.teacherSalary.findUnique({
    where: { id: salaryId },
    select: { id: true },
  });

  if (!salary) {
    throw new Error("Salary not found");
  }

  await prisma.$transaction(async (tx) => {
    // Unlink reports
    await tx.teacherDailyReport.updateMany({
      where: { salaryId },
      data: { salaryId: null },
    });

    // Delete expenses
    await tx.expense.deleteMany({
      where: { teacherSalaryId: salaryId },
    });

    // Delete salary
    await tx.teacherSalary.delete({
      where: { id: salaryId },
    });
  });

  return { success: true };
}

export async function getSalaryDetail(salaryId: string) {
  await isAuthorized("manager");

  if (!salaryId) {
    return null;
  }

  const salary = await prisma.teacherSalary.findUnique({
    where: { id: salaryId },
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
    return null;
  }

  const detailCollections = buildSalaryDetailCollections(
    salary as unknown as SalaryRecord,
  );

  return {
    ...mapSalaryRowWithTeacher(salary),
    teacher: salary.teacher,
    teacherProgresses: detailCollections.teacherProgresses,
    shiftTeacherData: detailCollections.shiftTeacherData,
  };
}

export async function getTeacherSalaryAnalytics() {
  await isAuthorized("manager");

  const salaries = await prisma.teacherSalary.findMany({
    select: {
      createdAt: true,
      totalSalary: true,
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const sumAmount = (items: typeof salaries) =>
    Number(
      items
        .reduce((sum, salary) => sum + Number(salary.totalSalary), 0)
        .toFixed(2),
    );

  const thisMonth = salaries.filter(
    (salary) => salary.createdAt >= startOfMonth,
  );
  const thisYear = salaries.filter((salary) => salary.createdAt >= startOfYear);
  const thisWeek = salaries.filter((salary) => salary.createdAt >= startOfWeek);

  return {
    totalSalaryAmount: sumAmount(salaries),
    totalSalaryCount: salaries.length,
    thisMonthSalaryAmount: sumAmount(thisMonth),
    thisMonthSalaryCount: thisMonth.length,
    thisYearSalaryAmount: sumAmount(thisYear),
    thisYearSalaryCount: thisYear.length,
    thisWeekSalaryAmount: sumAmount(thisWeek),
    thisWeekSalaryCount: thisWeek.length,
  };
}
