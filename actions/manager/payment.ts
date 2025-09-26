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
    // const where: any = {
    //   ...(month && { month: Number(month) }),
    //   ...(year && { year: Number(year) }),
    //   ...(startDate &&
    //     endDate && {
    //       createdAt: {
    //         gte: startDate,
    //         lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
    //       },
    //     }),
    //   ...(search && search.trim()
    //     ? {
    //         OR: [
    //           {
    //             user: {
    //               firstName: { contains: search.trim(), mode: "insensitive" },
    //             },
    //           },
    //           {
    //             user: {
    //               fatherName: { contains: search.trim(), mode: "insensitive" },
    //             },
    //           },
    //           {
    //             user: {
    //               lastName: { contains: search.trim(), mode: "insensitive" },
    //             },
    //           },
    //         ],
    //       }
    //     : {}),
    // };
    const where: any = {};

    const totalRows = await prisma.payment.count({
      where,
    });

    // Fetch the paginated data
    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { firstName: true, fatherName: true, lastName: true } },
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

export async function getYearsPayment(){
  try {
    const data = await prisma.payment.findMany({
      orderBy: { year: 'desc' },
      select: { year: true },
      distinct: ['year'],
    });
    return data
  } catch (error) {
    console.error("Failed to get years:", error);
    return [];
  }
}