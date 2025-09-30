"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import z from "zod";
import { MutationState } from "@/lib/definitions";

export async function getDeposit(
  filterByPayment?: string,
  page?: number,
  pageSize?: number,
  search?: string,
  startDate?: string,
  endDate?: string
) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;

  // Build the where clause for filtering
  const session = await auth();
  // const controllerId = session?.user?.id;

  //   check login user is admin
  if (session?.user?.role !== "manager") {
    return {
      error: "Access denied.",
      data: [],
    };
  }

  // Only add status filter if not "all"
  const where: any = {
    // ...(controllerId && { controllerId }),
    ...(filterByPayment &&
      filterByPayment !== "all" && { status: filterByPayment }),
    ...(search && search.trim()
      ? {
          OR: [
            {
              depositedTo: {
                firstName: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              depositedTo: {
                fatherName: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              depositedTo: {
                lastName: { contains: search.trim(), mode: "insensitive" },
              },
            },
            {
              depositedTo: {
                phoneNumber: { contains: search.trim(), mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(startDate && {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && {
          lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        }),
      },
    }),
  };

  try {
    // Get the total count of records matching the filter
    const totalRows = await prisma.deposit.count({ where });

    // Fetch the paginated data
    const deposits = await prisma.deposit.findMany({
      where,
      include: {
        depositedTo: {
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
        depositedBy: {
          select: {
            firstName: true,
            fatherName: true,
            lastName: true,
            phoneNumber: true,
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
    const data = deposits.map((item) => ({
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
    console.error("Failed to get deposits:", error);
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

// export async function approveDeposit(depositId: string) {
//   const session = await auth();
// //   const managerId = session?.user?.id;
//   if (session?.user?.role !== "manager") {
//     return {
//       error: "Access denied.",
//       data: null,
//     };
//   }
// }

export async function approveDeposit(depositId: string) {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      error: "Access denied.",
      data: null,
    };
  }

  try {
    // Find the deposit first
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId, status: "pending" },
      select: { id: true, amount: true, studentId: true },
    });

    if (!deposit) {
      return {
        error: "Deposit not found or already processed.",
        data: null,
      };
    }

    // Use a transaction to update deposit status and user balance atomically
    const [updatedDeposit, updatedUser] = await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data: { status: "approved" },
      }),
      prisma.user.update({
        where: { id: deposit.studentId },
        data: { balance: { increment: deposit.amount } },
      }),
    ]);

    return {
      error: null,
      data: { deposit: updatedDeposit, user: updatedUser },
    };
  } catch (error) {
    console.error("Failed to approve deposit:", error);
    return {
      error: "Failed to approve deposit.",
      data: null,
    };
  }
}
export async function rejectDeposit(depositId: string) {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      error: "Access denied.",
      data: null,
    };
  }

  try {
    // Find the deposit first
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId, status: "pending" },
      select: { id: true },
    });

    if (!deposit) {
      return {
        error: "Deposit not found or already processed.",
        data: null,
      };
    }

    // Only update the status to "rejected"
    const updatedDeposit = await prisma.deposit.update({
      where: { id: depositId },
      data: { status: "rejected" },
    });

    return {
      error: null,
      data: { deposit: updatedDeposit },
    };
  } catch (error) {
    console.error("Failed to reject deposit:", error);
    return {
      error: "Failed to reject deposit.",
      data: null,
    };
  }
}

export async function depositAnalytics() {
  try {
    const now = new Date();

    // This month deposit analytics
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

    const thisMonthDeposit = await prisma.deposit.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // This year deposit analytics
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const thisYearDeposit = await prisma.deposit.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // This week deposit analytics
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekDeposit = await prisma.deposit.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // Total deposit (all-time)
    const totalDeposit = await prisma.deposit.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      thisMonthDepositAmount: thisMonthDeposit._sum.amount || 0,
      thisMonthDepositCount: thisMonthDeposit._count.id || 0,
      thisYearDepositAmount: thisYearDeposit._sum.amount || 0,
      thisYearDepositCount: thisYearDeposit._count.id || 0,
      thisWeekDepositAmount: thisWeekDeposit._sum.amount || 0,
      thisWeekDepositCount: thisWeekDeposit._count.id || 0,
      totalDepositAmount: totalDeposit._sum.amount || 0,
      totalDepositCount: totalDeposit._count.id || 0,
    };
  } catch (error) {
    console.error("Failed to get deposit analytics:", error);
    return {
      thisMonthDepositAmount: 0,
      thisMonthDepositCount: 0,
      thisYearDepositAmount: 0,
      thisYearDepositCount: 0,
      thisWeekDepositAmount: 0,
      thisWeekDepositCount: 0,
      totalDepositAmount: 0,
      totalDepositCount: 0,
      error: "Failed to retrieve deposit analytics.",
    };
  }
}
