"use server";

import prisma from "@/lib/db";
import { paymentSchema } from "@/lib/zodSchema";
import { MutationState, TAttendance } from "@/lib/definitions";
import { isAuthorized, timeFormat12 } from "@/lib/utils";
import { z } from "zod";

export async function getMonthsPayment(
  search?: string,
  page?: number,
  pageSize?: number,
  month?: string,
  year?: string,
  startDate?: Date,
  endDate?: Date
) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;
  try {
    // Build the where clause correctly for Prisma
    const where: any = {
      ...(month && { month: Number(month) }),
      ...(year && { year: Number(year) }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
          },
        }),
      ...(search && search.trim()
        ? {
            OR: [
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
            ],
          }
        : {}),
    };

    const totalRows = await prisma.payment.count({
      where,
    });

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

    console.log("Payments fetched successfully:", data);

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

export async function getYearsPayment() {
  try {
    const data = await prisma.payment.findMany({
      orderBy: { year: "desc" },
      select: { year: true },
      distinct: ["year"],
    });
    console.log("Years fetched successfully:", data);
    const my = data.map((item) => ({
      value: item.year.toString(),
      label: item.year.toString(),
    }));
    console.log("Formatted years:", my);
    return my.map((item) => item.value);
  } catch (error) {
    console.error("Failed to get years:", error);
    return [];
  }
}

export async function paymentDashboard() {
  try {
    // Total payment sum
    const totalPayment = await prisma.payment.aggregate({
      _sum: { perMonthAmount: true },
    });

    // This month's payment sum
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const thisMonthPayment = await prisma.payment.aggregate({
      _sum: { perMonthAmount: true },
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // This month payment person count (unique students who made payments this month)
    const thisMonthPaymentPersonCount = await prisma.payment.groupBy({
      by: ["studentId"],
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _count: { studentId: true },
    });

    // This year payment sum
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const thisYearPayment = await prisma.payment.aggregate({
      _sum: { perMonthAmount: true },
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Max payment value
    const maxValuePayment = await prisma.payment.aggregate({
      _max: { perMonthAmount: true },
    });

    // Min payment value
    const minValuePayment = await prisma.payment.aggregate({
      _min: { perMonthAmount: true },
    });

    return {
      totalPayment: totalPayment._sum.perMonthAmount || 0,
      thisMonthPayment: thisMonthPayment._sum.perMonthAmount || 0,
      thisMonthPaymentPersonCount: thisMonthPaymentPersonCount.length,
      thisYearPayment: thisYearPayment._sum.perMonthAmount || 0,
      maxValuePayment: maxValuePayment._max.perMonthAmount || 0,
      minValuePayment: minValuePayment._min.perMonthAmount || 0,
    };
  } catch (error) {
    console.error("Failed to get payment dashboard data:", error);
    return {
      totalPayment: 0,
      thisMonthPayment: 0,
      thisMonthPaymentPersonCount: 0,
      thisYearPayment: 0,
      maxValuePayment: 0,
      minValuePayment: 0,
      error: "Failed to retrieve dashboard data.",
    };
  }
}
