"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/utils";
import { id } from "zod/v4/locales";

export async function getDeposit(
  filterByPayment?: string,
  page?: number,
  pageSize?: number,
  searchPhone?: string // <-- add this parameter
) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;

  // Build the where clause for filtering
  const session = await auth();

  // check login user is admin
  if (session?.user?.role !== "student") {
    return {
      error: "Access denied.",
      data: [],
    };
  }

  // gate the login student id
  const student = await isAuthorized("student");

  const where: any = {
    ...(filterByPayment &&
      filterByPayment !== "all" && { status: filterByPayment }),
    depositedTo: {
      id: student.id,
    },
  };

  try {
    // Get the total count of records matching the filter
    const totalRows = await prisma.deposit.count({ where });

    // Fetch the paginated data
    const deposits = await prisma.deposit.findMany({
      where,
      include: {
        // depositedTo: {
        //   select: {
        //     firstName: true,
        //     fatherName: true,
        //     lastName: true,
        //     phoneNumber: true,
        //   },
        // },
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

export async function getBalance() {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", balance: 0 };
  }
  const student = await isAuthorized("student");
  const balance = await prisma.user.findUnique({
    where: { id: student.id },
    select: { balance: true },
  });
  return { error: null, balance: balance?.balance };
}
