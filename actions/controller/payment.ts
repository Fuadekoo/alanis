"use server";

import prisma from "@/lib/db";
import { paymentSchema } from "@/lib/zodSchema";
import { MutationState, TAttendance } from "@/lib/definitions";
import { isAuthorized, timeFormat12 } from "@/lib/utils";
import { z } from "zod";

export async function getStudent(page?: number, pageSize?: number) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;

  // Get current controller from session
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const controllerId = session?.user?.id;

  if (!controllerId) {
    return {
      error: "Unauthorized access",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        itemsPerPage: pageSize,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  try {
    // Get the total count of students assigned to this controller
    const totalRows = await prisma.user.count({
      where: {
        role: "student",
        controllerId: controllerId,
      },
    });

    // Fetch paginated students assigned to this controller
    const students = await prisma.user.findMany({
      where: {
        role: "student",
        controllerId: controllerId,
      },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        phoneNumber: true,
        balance: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalRows / pageSize);

    return {
      data: students,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        itemsPerPage: pageSize,
        totalRecords: totalRows,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Failed to get students:", error);
    return {
      error: "Failed to retrieve data.",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        itemsPerPage: pageSize,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

export async function getPayment(
  studentId: string,
  page?: number,
  pageSize?: number,
  search?: string
) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;

  // Get current controller from session
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const controllerId = session?.user?.id;

  if (!controllerId) {
    return {
      error: "Unauthorized access",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        itemsPerPage: pageSize,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const where: any = {
    ...(studentId && { studentId }),
    // Only show payments for students assigned to this controller
    user: {
      controllerId: controllerId,
    },
    ...(search && search.trim()
      ? {
          OR: [
            { year: { equals: Number(search) } },
            { month: { equals: Number(search) } },
            {
              user: {
                firstName: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              user: {
                fatherName: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              user: {
                lastName: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              user: {
                phoneNumber: { contains: search.trim(), mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  try {
    // Get the total count of records matching the filter
    const totalRows = await prisma.payment.count({ where });

    // Fetch the paginated data
    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            fatherName: true,
            lastName: true,
            phoneNumber: true,
            roomStudent: {
              select: {
                teacher: {
                  select: {
                    firstName: true,
                    fatherName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalRows / pageSize);

    // Format the data for the client
    const data = payments.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        itemsPerPage: pageSize,
        totalRecords: totalRows,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Failed to get payments:", error);
    return {
      error: "Failed to retrieve data.",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        itemsPerPage: pageSize,
        totalRecords: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

export async function createPayment({
  studentId,
  perMonthAmount,
  monthsToPay, // array of strings: ["2025,1", "2025,2", ...]
}: {
  studentId: string;
  perMonthAmount: number;
  monthsToPay: string[];
}): Promise<MutationState> {
  try {
    console.log("Creating payment:", {
      studentId,
      perMonthAmount,
      monthsToPay,
    });

    // Get current controller from session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const controllerId = session?.user?.id;

    if (!controllerId) {
      return { status: false, message: "Unauthorized access" };
    }

    // 1. Calculate total payment needed
    const totalPayment = perMonthAmount * monthsToPay.length;

    // 2. Verify student belongs to this controller and get balance
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        controllerId: controllerId, // Ensure student belongs to this controller
      },
      select: {
        balance: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!student) {
      return {
        status: false,
        message: "Student not found or not assigned to you",
      };
    }

    if (Number(student.balance) < totalPayment) {
      return {
        status: false,
        message: `Insufficient balance. Required: ${totalPayment.toLocaleString()} ETB, Available: ${Number(
          student.balance
        ).toLocaleString()} ETB`,
      };
    }

    // 3. Prepare payment data
    const payments = monthsToPay.map((item) => {
      const [year, month] = item.split(",").map(Number);
      return {
        studentId,
        perMonthAmount,
        year,
        month,
      };
    });

    // 4. Transaction: create payments and deduct balance
    await prisma.$transaction([
      prisma.payment.createMany({ data: payments }),
      prisma.user.update({
        where: { id: studentId },
        data: { balance: { decrement: totalPayment } },
      }),
    ]);

    return {
      status: true,
      message: `Successfully created ${monthsToPay.length} payment(s)`,
    };
  } catch (error) {
    return { status: false, message: "Failed to create payment" };
  }
}

export async function rollbackPayment(
  paymentIds: string[],
  studentId: string
): Promise<MutationState> {
  try {
    console.log("Rolling back payments:", { paymentIds, studentId });

    // Get current controller from session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const controllerId = session?.user?.id;

    if (!controllerId) {
      return { status: false, message: "Unauthorized access" };
    }

    // 1. Get the payments to rollback (only for students assigned to this controller)
    const payments = await prisma.payment.findMany({
      where: {
        id: { in: paymentIds },
        studentId,
        user: {
          controllerId: controllerId, // Ensure student belongs to this controller
        },
      },
    });

    if (payments.length === 0) {
      return { status: false, message: "No payments found to rollback" };
    }

    // 2. Check if all payments are within 1 hour
    const now = new Date();
    for (const payment of payments) {
      const createdAt = new Date(payment.createdAt);
      const diffMs = now.getTime() - createdAt.getTime();
      if (diffMs > 60 * 60 * 1000) {
        // 1 hour in ms
        return {
          status: false,
          message: "Rollback period expired for one or more payments",
        };
      }
    }

    // 3. Calculate total refund
    const totalRefund = payments.reduce(
      (sum, p) => sum + Number(p.perMonthAmount),
      0
    );

    // 4. Transaction: delete payments, refund balance, and save negative payments
    await prisma.$transaction([
      prisma.payment.deleteMany({
        where: { id: { in: paymentIds }, studentId },
      }),
      prisma.user.update({
        where: { id: studentId },
        data: { balance: { increment: totalRefund } },
      }),
    ]);

    return {
      status: true,
      message: `Rollback successful for ${payments.length} payment(s)`,
    };
  } catch (error) {
    return { status: false, message: "Failed to rollback payment(s)" };
  }
}

export async function getBalance(studentId: string): Promise<number | null> {
  try {
    // Get current controller from session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const controllerId = session?.user?.id;

    if (!controllerId) {
      return null;
    }

    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        controllerId: controllerId, // Ensure student belongs to this controller
      },
      select: { balance: true },
    });
    return student?.balance || null;
  } catch (error) {
    console.error("Failed to get balance:", error);
    return null;
  }
}

// Controller Payment Analytics Dashboard
export async function controllerPaymentDashboard() {
  try {
    // Get current controller from session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const controllerId = session?.user?.id;

    if (!controllerId) {
      return null;
    }

    const controllerFilter = {
      user: {
        controllerId: controllerId,
      },
    };

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Total payments for this controller's students
    const totalPayments = await prisma.payment.count({
      where: controllerFilter,
    });

    // This month's payments
    const thisMonthPayments = await prisma.payment.count({
      where: {
        ...controllerFilter,
        year: currentYear,
        month: currentMonth,
      },
    });

    // Total amount paid by this controller's students
    const totalAmountResult = await prisma.payment.aggregate({
      where: controllerFilter,
      _sum: {
        perMonthAmount: true,
      },
    });

    // This month's total amount
    const thisMonthAmountResult = await prisma.payment.aggregate({
      where: {
        ...controllerFilter,
        year: currentYear,
        month: currentMonth,
      },
      _sum: {
        perMonthAmount: true,
      },
    });

    // Number of students with payments
    const studentsWithPayments = await prisma.user.count({
      where: {
        role: "student",
        controllerId: controllerId,
        payment: {
          some: {},
        },
      },
    });

    // Total number of students assigned to this controller
    const totalStudents = await prisma.user.count({
      where: {
        role: "student",
        controllerId: controllerId,
      },
    });

    return {
      totalPayments,
      thisMonthPayments,
      totalAmount: totalAmountResult._sum.perMonthAmount || 0,
      thisMonthAmount: thisMonthAmountResult._sum.perMonthAmount || 0,
      studentsWithPayments,
      totalStudents,
      paymentRate:
        totalStudents > 0 ? (studentsWithPayments / totalStudents) * 100 : 0,
    };
  } catch (error) {
    console.error("Failed to get payment dashboard data:", error);
    return null;
  }
}
