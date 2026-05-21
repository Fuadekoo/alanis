import "server-only";

import {
  AttendanceStatus,
  Prisma,
  SalaryStatus,
  TeacherStudentStatus,
} from "@prisma/client";

export type LearningProgressValue = "present" | "permission" | "absent";
export type LegacyPaymentStatus = "pending" | "approved" | "rejected";

export type BasicUser = {
  id: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  username?: string | null;
  phoneNumber?: string | null;
  controller?: {
    firstName: string;
    fatherName: string;
    lastName: string;
  } | null;
};

export const basicUserSelect = {
  id: true,
  firstName: true,
  fatherName: true,
  lastName: true,
  username: true,
  phoneNumber: true,
  controller: {
    select: {
      firstName: true,
      fatherName: true,
      lastName: true,
    },
  },
} satisfies Prisma.userSelect;

export const teacherSelect = {
  id: true,
  firstName: true,
  fatherName: true,
  lastName: true,
  username: true,
  phoneNumber: true,
} satisfies Prisma.userSelect;

export const reportWithRelationsInclude = {
  combination: {
    include: {
      student: {
        select: basicUserSelect,
      },
      teacher: {
        select: teacherSelect,
      },
    },
  },
} satisfies Prisma.TeacherDailyReportInclude;

export const comboWithRelationsInclude = {
  student: {
    select: basicUserSelect,
  },
  teacher: {
    select: teacherSelect,
  },
  dailyReports: {
    orderBy: {
      date: "desc",
    },
  },
} satisfies Prisma.TeacherStudentInclude;

export const teacherDailyReportSelect = {
  id: true,
  date: true,
  learningSlot: true,
  attendance: true,
  studentApproved: true,
  teacherApproved: true,
  salaryId: true,
} satisfies Prisma.TeacherDailyReportSelect;

export const comboProgressInclude = {
  student: {
    select: basicUserSelect,
  },
  teacher: {
    select: teacherSelect,
  },
  dailyReports: {
    select: teacherDailyReportSelect,
    orderBy: {
      date: "desc",
    },
  },
} satisfies Prisma.TeacherStudentInclude;

export function toLegacyLearningProgress(
  attendance: AttendanceStatus,
): LearningProgressValue {
  switch (attendance) {
    case AttendanceStatus.PRESENT:
      return "present";
    case AttendanceStatus.PERMISSION:
      return "permission";
    default:
      return "absent";
  }
}

export function toAttendanceStatus(
  progress: LearningProgressValue,
): AttendanceStatus {
  switch (progress) {
    case "present":
      return AttendanceStatus.PRESENT;
    case "permission":
      return AttendanceStatus.PERMISSION;
    default:
      return AttendanceStatus.ABSENT;
  }
}

export function toLegacySalaryStatus(
  status: SalaryStatus | null | undefined,
): LegacyPaymentStatus {
  switch (status) {
    case SalaryStatus.PAID:
      return "approved";
    case SalaryStatus.CANCELLED:
      return "rejected";
    default:
      return "pending";
  }
}

export function toSalaryStatus(status: string): SalaryStatus {
  switch (status) {
    case "approved":
    case "PAID":
      return SalaryStatus.PAID;
    case "rejected":
    case "CANCELLED":
      return SalaryStatus.CANCELLED;
    default:
      return SalaryStatus.PENDING;
  }
}

export function toTeacherStudentStatus(status: string | null | undefined) {
  return status === "inactive"
    ? TeacherStudentStatus.INACTIVE
    : TeacherStudentStatus.ACTIVE;
}

export function normalizeDay(value?: string | Date | null) {
  const source = value ? new Date(value) : new Date();
  if (Number.isNaN(source.getTime())) {
    throw new Error("Invalid date value provided");
  }

  return new Date(
    Date.UTC(
      source.getUTCFullYear(),
      source.getUTCMonth(),
      source.getUTCDate(),
    ),
  );
}

export function parseDateInput(value?: string | Date | null) {
  if (typeof value === "string") {
    const parts = value.split("-");
    if (parts.length !== 3) {
      throw new Error("Invalid date format. Expected YYYY-MM-DD");
    }

    const [year, month, day] = parts.map(Number);
    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      throw new Error("Invalid date value provided");
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  return normalizeDay(value);
}

export function getMonthRange(year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return {
    startDate,
    endDate,
    daysInMonth: new Date(year, month, 0).getDate(),
  };
}

export function formatUserName(user: {
  firstName?: string | null;
  fatherName?: string | null;
  lastName?: string | null;
}) {
  return [user.firstName, user.fatherName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function getRoomTime(
  rooms: Array<{ teacherId: string; studentId: string; time: string }>,
  teacherId: string,
  studentId: string,
) {
  return (
    rooms.find(
      (room) => room.teacherId === teacherId && room.studentId === studentId,
    )?.time ?? ""
  );
}

export function mapReportToCalendarReport(
  report: {
    id: string;
    date: Date;
    learningSlot: string | null;
    attendance: AttendanceStatus;
    studentApproved: boolean | null;
    teacherApproved: boolean | null;
    combination: {
      studentId: string;
      teacher: {
        firstName: string;
        fatherName: string;
        lastName: string;
      };
    };
  },
  includeTeacherName = false,
) {
  const mapped = {
    id: report.id,
    studentId: report.combination.studentId,
    date: report.date,
    learningProgress: toLegacyLearningProgress(report.attendance),
    learningSlot: report.learningSlot,
    studentApproved: report.studentApproved,
    teacherApproved: report.teacherApproved,
    approved: report.teacherApproved ?? report.studentApproved ?? null,
  };

  if (!includeTeacherName) {
    return mapped;
  }

  return {
    ...mapped,
    teacherName: formatUserName(report.combination.teacher),
  };
}

export function summarizeReports(
  reports: Array<{
    attendance: AttendanceStatus;
    salaryId: string | null;
  }>,
) {
  let learningCount = 0;
  let missingCount = 0;
  let totalCount = 0;
  let pendingSalaryCount = 0;

  for (const report of reports) {
    totalCount += 1;

    if (report.attendance === AttendanceStatus.ABSENT) {
      missingCount += 1;
      continue;
    }

    learningCount += 1;
    if (!report.salaryId) {
      pendingSalaryCount += 1;
    }
  }

  return {
    learningCount,
    missingCount,
    totalCount,
    pendingSalaryCount,
  };
}

export function buildProgressRecord(combo: {
  id: string;
  teacherId: string;
  studentId: string;
  status: TeacherStudentStatus;
  active: boolean;
  createdAt: Date;
  student: BasicUser;
  teacher: BasicUser;
  dailyReports: Array<{
    id: string;
    date: Date;
    learningSlot: string | null;
    attendance: AttendanceStatus;
    studentApproved: boolean | null;
    teacherApproved: boolean | null;
    salaryId: string | null;
  }>;
}) {
  const stats = summarizeReports(combo.dailyReports);
  const paymentStatus: LegacyPaymentStatus =
    stats.learningCount === 0
      ? "pending"
      : stats.pendingSalaryCount > 0
        ? "pending"
        : "approved";

  return {
    id: combo.id,
    teacherId: combo.teacherId,
    studentId: combo.studentId,
    learningSlot:
      combo.dailyReports.find((report) => report.learningSlot)?.learningSlot ??
      null,
    learningCount: stats.learningCount,
    pendingSalaryCount: stats.pendingSalaryCount,
    missingCount: stats.missingCount,
    totalCount: stats.totalCount,
    progressStatus:
      combo.active && combo.status === TeacherStudentStatus.ACTIVE
        ? "open"
        : "closed",
    paymentStatus,
    createdAt: combo.createdAt,
    student: combo.student,
    teacher: combo.teacher,
    dailyReports: combo.dailyReports.map((report) => ({
      id: report.id,
      date: report.date,
      learningSlot: report.learningSlot,
      learningProgress: toLegacyLearningProgress(report.attendance),
      approved: report.teacherApproved ?? report.studentApproved ?? null,
    })),
  };
}

export type LegacyProgressRecord = ReturnType<typeof buildProgressRecord>;

export function splitProgressRecords(
  combos: Array<{
    id: string;
    teacherId: string;
    studentId: string;
    status: TeacherStudentStatus;
    active: boolean;
    createdAt: Date;
    student: BasicUser;
    teacher: BasicUser;
    dailyReports: Array<{
      id: string;
      date: Date;
      learningSlot: string | null;
      attendance: AttendanceStatus;
      studentApproved: boolean | null;
      teacherApproved: boolean | null;
      salaryId: string | null;
    }>;
  }>,
) {
  const currentProgress: LegacyProgressRecord[] = [];
  const historicalProgress: LegacyProgressRecord[] = [];

  for (const combo of combos) {
    const record = buildProgressRecord(combo);
    if (record.progressStatus === "open") {
      currentProgress.push(record);
    } else {
      historicalProgress.push(record);
    }
  }

  return { currentProgress, historicalProgress };
}

function summarizeProgressGroup(records: LegacyProgressRecord[]) {
  return {
    totalStudents: records.length,
    totalLearningCount: records.reduce(
      (sum, record) => sum + record.learningCount,
      0,
    ),
    totalMissingCount: records.reduce(
      (sum, record) => sum + record.missingCount,
      0,
    ),
    totalReports: records.reduce(
      (sum, record) => sum + record.dailyReports.length,
      0,
    ),
  };
}

export function buildProgressStatistics(
  currentProgress: LegacyProgressRecord[],
  historicalProgress: LegacyProgressRecord[],
) {
  const current = summarizeProgressGroup(currentProgress);
  const historical = summarizeProgressGroup(historicalProgress);

  return {
    current,
    historical,
    overall: {
      totalStudents: current.totalStudents + historical.totalStudents,
      totalLearningCount:
        current.totalLearningCount + historical.totalLearningCount,
      totalMissingCount:
        current.totalMissingCount + historical.totalMissingCount,
      totalReports: current.totalReports + historical.totalReports,
    },
  };
}

export function mapSalaryToRow(salary: {
  id: string;
  month: number;
  year: number;
  dailyRate: Prisma.Decimal;
  totalSalary: Prisma.Decimal;
  status: SalaryStatus;
  paymentPhoto: string | null;
  createdAt: Date;
  paidAt: Date | null;
  note: string | null;
  reports: Array<{
    attendance: AttendanceStatus;
  }>;
}) {
  const totalDayForLearning = salary.reports.filter(
    (report) => report.attendance !== AttendanceStatus.ABSENT,
  ).length;

  return {
    id: salary.id,
    month: salary.month,
    year: salary.year,
    totalDayForLearning,
    unitPrice: Number(salary.dailyRate),
    amount: Number(salary.totalSalary),
    status: toLegacySalaryStatus(salary.status),
    paymentPhoto: salary.paymentPhoto,
    createdAt: salary.createdAt,
    paidAt: salary.paidAt,
    note: salary.note,
  };
}

export function buildSalaryDetailCollections(salary: {
  status: SalaryStatus;
  reports: Array<{
    id: string;
    date: Date;
    learningSlot: string | null;
    attendance: AttendanceStatus;
    studentApproved: boolean | null;
    teacherApproved: boolean | null;
    combination: {
      id: string;
      teacherId: string;
      studentId: string;
      active: boolean;
      status: TeacherStudentStatus;
      createdAt: Date;
      student: BasicUser;
      teacher: BasicUser;
    };
  }>;
}) {
  const grouped = new Map<
    string,
    {
      id: string;
      teacherId: string;
      studentId: string;
      active: boolean;
      status: TeacherStudentStatus;
      createdAt: Date;
      student: BasicUser;
      teacher: BasicUser;
      dailyReports: Array<{
        id: string;
        date: Date;
        learningSlot: string | null;
        attendance: AttendanceStatus;
        studentApproved: boolean | null;
        teacherApproved: boolean | null;
        salaryId: string | null;
      }>;
    }
  >();

  for (const report of salary.reports) {
    const combo = report.combination;
    const existing = grouped.get(combo.id) ?? {
      id: combo.id,
      teacherId: combo.teacherId,
      studentId: combo.studentId,
      active: combo.active,
      status: combo.status,
      createdAt: combo.createdAt,
      student: combo.student,
      teacher: combo.teacher,
      dailyReports: [],
    };

    existing.dailyReports.push({
      id: report.id,
      date: report.date,
      learningSlot: report.learningSlot,
      attendance: report.attendance,
      studentApproved: report.studentApproved,
      teacherApproved: report.teacherApproved,
      salaryId: "linked",
    });

    grouped.set(combo.id, existing);
  }

  const mapped = Array.from(grouped.values()).map((combo) => {
    const base = buildProgressRecord(combo);
    return {
      ...base,
      paymentStatus: toLegacySalaryStatus(salary.status),
    };
  });

  return {
    teacherProgresses: mapped.filter((item) => item.progressStatus === "open"),
    shiftTeacherData: mapped.filter((item) => item.progressStatus !== "open"),
  };
}

export function createSalaryExpenseName(
  teacher: { firstName: string; fatherName: string; lastName: string },
  month: number,
  year: number,
) {
  return `${formatUserName(teacher)} ${month}/${year}`.trim();
}
