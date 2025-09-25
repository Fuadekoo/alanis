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

  try {
    // Get the total count of students
    const totalRows = await prisma.user.count({
      where: { role: "student" },
    });

    // Fetch paginated students
    const students = await prisma.user.findMany({
      where: { role: "student" },
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        phoneNumber: true,
        balance: true,
      },
      // orderBy: { createdAt: "desc" },
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

  const where: any = {
    // ...(studentId && { studentId }),
    ...(search && search.trim()
      ? {
          OR: [
            { year: { equals: Number(search) } },
            { month: { equals: Number(search) } },
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
    // 1. Calculate total payment needed
    const totalPayment = perMonthAmount * monthsToPay.length;

    // 2. Get student balance
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { balance: true },
    });
    if (!student) return { status: false, message: "Student not found" };

    if (Number(student.balance) < totalPayment) {
      return { status: false, message: "Insufficient balance" };
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
    // 1. Get the payments to rollback
    const payments = await prisma.payment.findMany({
      where: {
        id: { in: paymentIds },
        studentId,
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
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { balance: true },
    });
    return student?.balance || null;
  } catch (error) {
    console.error("Failed to get balance:", error);
    return null;
  }
}
