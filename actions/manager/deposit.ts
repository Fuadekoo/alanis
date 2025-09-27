"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import z from "zod";
import { MutationState } from "@/lib/definitions";

export async function getDeposit(
  filterByPayment?: string,
  page?: number,
  pageSize?: number,
  searchPhone?: string,
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
    ...(searchPhone
      ? {
          depositedTo: {
            phoneNumber: { contains: searchPhone },
          },
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
