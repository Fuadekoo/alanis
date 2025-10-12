"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import z from "zod";
import { MutationState } from "@/lib/definitions";
import { DepositSchema } from "@/lib/zodSchema";
import { startOfMonth, endOfMonth } from "date-fns";

// export async function getDeposit(
//   filterByPayment?: string,
//   page?: number,
//   pageSize?: number
// ) {
//   // Set default pagination values
//   page = page && page > 0 ? page : 1;
//   pageSize = pageSize && pageSize > 0 ? pageSize : 50;

//   // Reset pagination if a search term is provided
//   if (search) {
//     pageSize = 10;
//     page = 1;
//   }

//   // Build the where clause for filtering
//   const session = await auth();
//   const controllerId = session?.user?.id;

//   const where = {
//     ...(controllerId && { controllerId }),
//     ...(search
//       ? {
//           // OR: [
//           //     {
//           //         student: {
//           //             is: {
//           //                 firstName: { contains: search },
//           //             },
//           //         },
//           //     },
//           //     {
//           //         student: {
//           //             is: {
//           //                 lastName: { contains: search },
//           //             },
//           //         },
//           //     },
//           //     {
//           //         student: {
//           //             is: {
//           //                 phoneNumber: { contains: search },
//           //             },
//           //         },
//           //     },
//           // ],
//         }
//       : {}),
//   };

//   try {
//     // Get the total count of records matching the filter
//     const totalRows = await prisma.deposit.count({ where });

//     // Fetch the paginated data
//     const deposits = await prisma.deposit.findMany({
//       where,
//       include: {
//         depositedTo: {
//           select: {
//             firstName: true,
//             fatherName: true,
//             lastName: true,
//             phoneNumber: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       skip: (page - 1) * pageSize,
//       take: pageSize,
//     });

//     const totalPages = Math.ceil(totalRows / pageSize);

//     // Format the data for the client
//     const data = deposits.map((item) => ({
//       ...item,
//       createdAt: item.createdAt.toISOString(),
//     }));

//     return {
//       data,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         itemsPerPage: pageSize,
//         totalRecords: totalRows,
//         hasNextPage: page < totalPages,
//         hasPreviousPage: page > 1,
//       },
//     };
//   } catch (error) {
//     console.error("Failed to get deposits:", error);
//     return {
//       error: "Failed to retrieve data.",
//       data: [],
//       pagination: {
//         currentPage: 1,
//         totalPages: 0,
//         itemsPerPage: pageSize,
//         totalRecords: 0,
//         hasNextPage: false,
//         hasPreviousPage: false,
//       },
//     };
//   }
// }

export async function getDeposit(
  filterByPayment?: string,
  page?: number,
  pageSize?: number,
  search?: string // Enhanced search parameter for student name, phone, etc.
) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;

  // Build the where clause for filtering
  const session = await auth();
  const controllerId = session?.user?.id;

  const where: any = {
    ...(controllerId && { controllerId }),
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

export async function depositCreate({
  studentId,
  amount,
  photo,
}: DepositSchema): Promise<MutationState> {
  console.log("Received deposit data:", { studentId, amount, photo });
  try {
    const sessionId = (await auth())?.user?.id;
    if (!sessionId) throw new Error("unauthenticated");
    await prisma.deposit.create({
      data: {
        studentId,
        amount,
        controllerId: sessionId,
        photo: photo ?? "", // Always provide photo, default to empty string if undefined
      },
    });
    return { status: true, message: "successfully deposit" };
  } catch (error) {
    console.error("Deposit creation failed:", error);
    return { status: false, message: "failed to deposit" };
  }
}

export async function depositUpdate(
  id: string,
  { studentId, amount, photo }: DepositSchema
): Promise<MutationState> {
  try {
    await prisma.deposit.update({
      where: { id, status: "pending" },
      data: { studentId, amount, photo },
    });
    return { status: true, message: "successfully update deposit" };
  } catch (error) {
    return { status: false, message: "failed to update deposit" };
  }
}

export async function deleteDeposit(id: string): Promise<MutationState> {
  try {
    await prisma.deposit.delete({
      where: { id, status: { in: ["pending", "rejected"] } },
    });
    return { status: true, message: "successfully delete deposit" };
  } catch (error) {
    return { status: false, message: "failed to delete deposit" };
  }
}

export async function getDepositById(id: string) {
  try {
    const depositData = await prisma.deposit.findUnique({ where: { id } });
    return depositData;
  } catch (error) {
    return null;
  }
}

export async function getStudent(search?: string) {
  try {
    // Get current controller from session
    const session = await auth();
    const controllerId = session?.user?.id;

    if (!controllerId) {
      return [];
    }

    const where: any = {
      role: "student",
      controllerId: controllerId, // Only show students assigned to this controller
    };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        fatherName: true,
        lastName: true,
        phoneNumber: true,
        balance: true, // Include balance for better UX
      },
    });
    return students;
  } catch (error) {
    return [];
  }
}

// HELP ME PLASE I N this i went to total deposits,aprove deposit, reject deposit, this month deposit ,this month reject and so on
export async function controllerDepositDashboard() {
  try {
    // Get current controller from session
    const session = await auth();
    const controllerId = session?.user?.id;

    if (!controllerId) {
      return null;
    }

    // Filter all queries to only include deposits created by this controller
    const controllerFilter = { controllerId };

    const totalDeposits = await prisma.deposit.count({
      where: controllerFilter,
    });
    const approvedDeposits = await prisma.deposit.count({
      where: {
        status: "approved",
        ...controllerFilter,
      },
    });
    const rejectedDeposits = await prisma.deposit.count({
      where: {
        status: "rejected",
        ...controllerFilter,
      },
    });
    const pendingDeposits = await prisma.deposit.count({
      where: {
        status: "pending",
        ...controllerFilter,
      },
    });
    const thisMonthDeposits = await prisma.deposit.count({
      where: {
        ...controllerFilter,
        createdAt: {
          gte: startOfMonth(new Date()),
          lt: endOfMonth(new Date()),
        },
      },
    });
    const thisMonthRejected = await prisma.deposit.count({
      where: {
        ...controllerFilter,
        status: "rejected",
        createdAt: {
          gte: startOfMonth(new Date()),
          lt: endOfMonth(new Date()),
        },
      },
    });
    const thisMonthPending = await prisma.deposit.count({
      where: {
        ...controllerFilter,
        status: "pending",
        createdAt: {
          gte: startOfMonth(new Date()),
          lt: endOfMonth(new Date()),
        },
      },
    });

    return {
      totalDeposits,
      approvedDeposits,
      rejectedDeposits,
      pendingDeposits,
      thisMonthDeposits,
      thisMonthRejected,
      thisMonthPending,
    };
  } catch (error) {
    console.error("Failed to get deposit dashboard data:", error);
    return null;
  }
}
