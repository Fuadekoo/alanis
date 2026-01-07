"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { expenseSchema } from "@/lib/zodSchema";
import { MutationState } from "@/lib/definitions";
import z from "zod";

export async function getExpenses(
  search?: string,
  page?: number,
  pageSize?: number,
  startDate?: Date,
  endDate?: Date
) {
  // Set default pagination values
  page = page && page > 0 ? page : 1;
  pageSize = pageSize && pageSize > 0 ? pageSize : 50;

  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      error: "Access denied.",
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

  // Build the where clause for filtering
  const where: any = {
    ...(search && search.trim()
      ? {
          OR: [
            {
              name: { contains: search.trim(), mode: "insensitive" },
            },
            {
              description: { contains: search.trim(), mode: "insensitive" },
            },
          ],
        }
      : {}),
    ...(startDate &&
      endDate && {
        date: {
          gte: startDate,
          lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
        },
      }),
  };

  try {
    // Get the total count of records matching the filter
    const totalRows = await prisma.expense.count({ where });

    // Fetch the paginated data
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalRows / pageSize);

    // Format the data for the client
    const data = expenses.map((item) => ({
      ...item,
      date: item.date.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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
    console.error("Failed to get expenses:", error);
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

export async function createExpense(
  data: z.infer<typeof expenseSchema>,
  editingId?: string
): Promise<MutationState> {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      status: false,
      message: "Access denied.",
    };
  }

  try {
    // Validate input
    const validatedData = expenseSchema.parse(data);

    // If editingId is provided, update instead of create
    if (editingId) {
      const existingExpense = await prisma.expense.findUnique({
        where: { id: editingId },
      });

      if (!existingExpense) {
        return {
          status: false,
          message: "Expense not found.",
        };
      }

      await prisma.expense.update({
        where: { id: editingId },
        data: {
          name: validatedData.name,
          amount: validatedData.amount,
          date: validatedData.date,
          description: validatedData.description || "",
          ...(validatedData.paymentPhoto
            ? { paymentPhoto: validatedData.paymentPhoto }
            : {}),
        },
      });

      return {
        status: true,
        message: "Expense updated successfully.",
      };
    }

    // Create new expense
    await prisma.expense.create({
      data: {
        name: validatedData.name,
        amount: validatedData.amount,
        date: validatedData.date,
        description: validatedData.description || "",
        paymentPhoto: validatedData.paymentPhoto || undefined,
      },
    });

    return {
      status: true,
      message: "Expense created successfully.",
    };
  } catch (error) {
    console.error("Failed to create/update expense:", error);
    if (error instanceof z.ZodError) {
      return {
        status: false,
        message: error.errors[0]?.message || "Validation failed.",
      };
    }
    return {
      status: false,
      message: "Failed to create/update expense.",
    };
  }
}

export async function deleteExpense(id: string): Promise<MutationState> {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      status: false,
      message: "Access denied.",
    };
  }

  try {
    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return {
        status: false,
        message: "Expense not found.",
      };
    }

    await prisma.expense.delete({
      where: { id },
    });

    return {
      status: true,
      message: "Expense deleted successfully.",
    };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return {
      status: false,
      message: "Failed to delete expense.",
    };
  }
}

export async function getExpenseAnalytics() {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      error: "Access denied.",
      thisMonthExpenseAmount: 0,
      thisMonthExpenseCount: 0,
      thisYearExpenseAmount: 0,
      thisYearExpenseCount: 0,
      thisWeekExpenseAmount: 0,
      thisWeekExpenseCount: 0,
      totalExpenseAmount: 0,
      totalExpenseCount: 0,
    };
  }

  try {
    const now = new Date();

    // This month expense analytics
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

    const thisMonthExpense = await prisma.expense.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // This year expense analytics
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const thisYearExpense = await prisma.expense.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // This week expense analytics
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekExpense = await prisma.expense.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    // Total expense (all-time)
    const totalExpense = await prisma.expense.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      thisMonthExpenseAmount: thisMonthExpense._sum.amount || 0,
      thisMonthExpenseCount: thisMonthExpense._count.id || 0,
      thisYearExpenseAmount: thisYearExpense._sum.amount || 0,
      thisYearExpenseCount: thisYearExpense._count.id || 0,
      thisWeekExpenseAmount: thisWeekExpense._sum.amount || 0,
      thisWeekExpenseCount: thisWeekExpense._count.id || 0,
      totalExpenseAmount: totalExpense._sum.amount || 0,
      totalExpenseCount: totalExpense._count.id || 0,
    };
  } catch (error) {
    console.error("Failed to get expense analytics:", error);
    return {
      error: "Failed to retrieve expense analytics.",
      thisMonthExpenseAmount: 0,
      thisMonthExpenseCount: 0,
      thisYearExpenseAmount: 0,
      thisYearExpenseCount: 0,
      thisWeekExpenseAmount: 0,
      thisWeekExpenseCount: 0,
      totalExpenseAmount: 0,
      totalExpenseCount: 0,
    };
  }
}
