"use client";
import React, { useState, useEffect } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Skeleton,
} from "@heroui/react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getExpenseAnalytics,
} from "@/actions/manager/expense";
import { depositAnalytics } from "@/actions/manager/deposit";
import { addToast } from "@heroui/toast";
import { useLocalization } from "@/hooks/useLocalization";
import { useRegistration } from "@/hooks/useRegistration";
import { expenseSchema } from "@/lib/zodSchema";
import {
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  FileText,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Calculator,
} from "lucide-react";
import { DatePicker } from "@/components/ui/heroui";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import { X } from "lucide-react";

function Page() {
  const { t, formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(
    null
  );
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);

  // Analytics data
  const [analyticsData, isLoadingAnalytics] = useData(
    getExpenseAnalytics,
    () => {}
  );

  // Deposit analytics (income) data
  const [depositAnalyticsData, isLoadingDepositAnalytics] = useData(
    depositAnalytics,
    () => {}
  );

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getExpenses,
    () => {},
    search,
    page,
    pageSize,
    startDate,
    endDate
  );

  // Registration form
  const form = useRegistration(
    async (data, editingIdParam) => {
      // Extract id from data if present, otherwise use parameter
      const idToUse = data.id || editingIdParam;
      // Remove id from data before sending
      const { id, ...expenseData } = data;
      return await createExpense(expenseData, idToUse);
    },
    expenseSchema,
    (state) => {
      if (state.status) {
        refresh();
        setEditingId(undefined);
      }
    }
  );

  // Delete mutation
  const [deleteAction, isLoadingDelete] = useMutation(
    deleteExpense,
    (state) => {
      setProcessingDeleteId(null);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      refresh();
      addToast({
        title: "Delete Expense",
        description: state?.message || "Expense deleted successfully.",
      });
    }
  );

  // Handle edit
  const handleEdit = (expense: {
    id: string;
    name: string;
    amount: number;
    date: string;
    description?: string;
  }) => {
    setEditingId(expense.id);
    form.edit({
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      date: new Date(expense.date),
      description: expense.description || "",
    });
  };

  // Handle delete click
  const handleDeleteClick = (id: string, name: string) => {
    setExpenseToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      setProcessingDeleteId(expenseToDelete.id);
      deleteAction(expenseToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  // Handle date change
  const handleDateChange = (dates: {
    startDate: string | null;
    endDate: string | null;
  }) => {
    setStartDate(dates.startDate ? new Date(dates.startDate) : undefined);
    setEndDate(dates.endDate ? new Date(dates.endDate) : undefined);
    setPage(1);
  };

  // Reset editing when modal closes
  useEffect(() => {
    if (!form.isOpen && editingId) {
      setEditingId(undefined);
    }
  }, [form.isOpen, editingId]);

  const rows = (data?.data || []).map(
    (expense: {
      id: string;
      name: string;
      amount: number;
      date: string;
      description?: string | null;
      createdAt: string;
    }) => ({
      key: String(expense.id),
      id: String(expense.id),
      name: expense.name || "",
      amount: expense.amount != null ? String(expense.amount) : "",
      date: expense.date || "",
      description: expense.description || "",
      createdAt: expense.createdAt || "",
    })
  );

  const columns = [
    {
      key: "name",
      label: "Expense Name",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="font-semibold text-red-600 dark:text-red-400">
          {formatCurrency(Number(item.amount))}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => {
        const date = new Date(item.date);
        return (
          <span className="text-sm">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      key: "description",
      label: "Description",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => handleEdit(item)}
            aria-label="Edit expense"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            color="danger"
            onPress={() => handleDeleteClick(item.id, item.name)}
            aria-label="Delete expense"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto px-2 py-6">
      <div className="w-full mx-auto grid grid-rows-[auto_auto_1fr] gap-6 overflow-hidden">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {/* Total Expenses Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 dark:text-red-200 text-sm font-medium">
                  Total Expenses
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.totalExpenseAmount || 0)
                      )}
                </p>
                <p className="text-red-100 dark:text-red-200 text-xs mt-1">
                  {analyticsData?.totalExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Expenses Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  This Month
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.thisMonthExpenseAmount || 0)
                      )}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {analyticsData?.thisMonthExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Year Expenses Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  This Year
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.thisYearExpenseAmount || 0)
                      )}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {analyticsData?.thisYearExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Week Expenses Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  This Week
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.thisWeekExpenseAmount || 0)
                      )}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {analyticsData?.thisWeekExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Expense Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Register and manage your expenses
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => {
                setEditingId(undefined);
                form.add();
              }}
              className="w-full sm:w-auto"
            >
              Add Expense
            </Button>
            <Button
              color="secondary"
              variant="flat"
              startContent={<Calculator className="h-4 w-4" />}
              onPress={() => setCalculatorModalOpen(true)}
              className="w-full sm:w-auto"
            >
              Calculator
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-h-0">
          <CustomTable
            columns={columns}
            rows={rows.map((row: Record<string, string | number>) =>
              Object.fromEntries(
                Object.entries(row).map(([k, v]) => [k, v ?? ""])
              )
            )}
            totalRows={data?.pagination?.totalRecords || 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            searchValue={search}
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            isLoading={isLoading}
            enableDateFilter
            startDate={startDate?.toISOString().split("T")[0] || null}
            endDate={endDate?.toISOString().split("T")[0] || null}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

      {/* Registration/Edit Modal */}
      <Modal
        isOpen={form.isOpen}
        onOpenChange={form.onOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={form.onSubmit}>
              <ModalHeader>
                {editingId ? "Edit Expense" : "Register New Expense"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Expense Name"
                  labelPlacement="outside"
                  placeholder="Enter expense name"
                  {...form.register("name")}
                  isRequired
                  errorMessage={form.validationErrors.name}
                  isInvalid={!!form.validationErrors.name}
                />
                <Input
                  label="Amount"
                  labelPlacement="outside"
                  placeholder="Enter amount"
                  type="number"
                  {...form.register("amount")}
                  isRequired
                  errorMessage={form.validationErrors.amount}
                  isInvalid={!!form.validationErrors.amount}
                  startContent={<span className="text-gray-500">ETB</span>}
                />
                <div className="flex gap-2">
                  <DatePicker
                    className="flex-1"
                    label="Date"
                    labelPlacement="outside"
                    value={
                      form.watch("date")
                        ? parseDate(
                            form.watch("date")?.toISOString().split("T")[0] ??
                              ""
                          )
                        : null
                    }
                    onChange={(v) => {
                      if (v) {
                        form.setValue("date", v.toDate(getLocalTimeZone()));
                      }
                    }}
                    isRequired
                  />
                  {form.watch("date") && (
                    <Button
                      isIconOnly
                      variant="flat"
                      color="danger"
                      className="mt-8"
                      onPress={() => form.setValue("date", new Date())}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                {form.validationErrors.date && (
                  <p className="text-sm text-danger">
                    {form.validationErrors.date}
                  </p>
                )}
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Enter description (optional)"
                  {...form.register("description")}
                  errorMessage={form.validationErrors.description}
                  isInvalid={!!form.validationErrors.description}
                  minRows={3}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={form.isLoading}
                  startContent={!form.isLoading && <Plus className="h-4 w-4" />}
                >
                  {editingId ? "Update Expense" : "Register Expense"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Expense</ModalHeader>
              <ModalBody>
                <p className="text-center p-5">
                  Are you sure you want to delete the expense{" "}
                  <span className="font-semibold text-danger">
                    "{expenseToDelete?.name}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={handleCancelDelete}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmDelete}
                  isLoading={
                    isLoadingDelete &&
                    processingDeleteId === expenseToDelete?.id
                  }
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Calculator Modal */}
      <Modal
        isOpen={calculatorModalOpen}
        onOpenChange={setCalculatorModalOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => {
            // Calculate net values (Income - Expense)
            const thisMonthIncome =
              Number(depositAnalyticsData?.thisMonthDepositAmount || 0) || 0;
            const thisMonthExpense =
              Number(analyticsData?.thisMonthExpenseAmount || 0) || 0;
            const thisMonthNet = thisMonthIncome - thisMonthExpense;

            const thisYearIncome =
              Number(depositAnalyticsData?.thisYearDepositAmount || 0) || 0;
            const thisYearExpense =
              Number(analyticsData?.thisYearExpenseAmount || 0) || 0;
            const thisYearNet = thisYearIncome - thisYearExpense;

            const thisWeekIncome =
              Number(depositAnalyticsData?.thisWeekDepositAmount || 0) || 0;
            const thisWeekExpense =
              Number(analyticsData?.thisWeekExpenseAmount || 0) || 0;
            const thisWeekNet = thisWeekIncome - thisWeekExpense;

            return (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    <span>Income vs Expense Calculator</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-6">
                    {/* This Month */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        This Month
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Income (Deposits):
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {isLoadingDepositAnalytics
                              ? "..."
                              : formatCurrency(thisMonthIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Expenses:
                          </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {isLoadingAnalytics
                              ? "..."
                              : formatCurrency(thisMonthExpense)}
                          </span>
                        </div>
                        <hr className="border-gray-300 dark:border-gray-600" />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            Net (Income - Expense):
                          </span>
                          <span
                            className={`text-xl font-bold ${
                              thisMonthNet >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isLoadingDepositAnalytics || isLoadingAnalytics
                              ? "..."
                              : formatCurrency(thisMonthNet)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* This Year */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        This Year
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Income (Deposits):
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {isLoadingDepositAnalytics
                              ? "..."
                              : formatCurrency(thisYearIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Expenses:
                          </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {isLoadingAnalytics
                              ? "..."
                              : formatCurrency(thisYearExpense)}
                          </span>
                        </div>
                        <hr className="border-gray-300 dark:border-gray-600" />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            Net (Income - Expense):
                          </span>
                          <span
                            className={`text-xl font-bold ${
                              thisYearNet >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isLoadingDepositAnalytics || isLoadingAnalytics
                              ? "..."
                              : formatCurrency(thisYearNet)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* This Week */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        This Week
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Income (Deposits):
                          </span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {isLoadingDepositAnalytics
                              ? "..."
                              : formatCurrency(thisWeekIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">
                            Expenses:
                          </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {isLoadingAnalytics
                              ? "..."
                              : formatCurrency(thisWeekExpense)}
                          </span>
                        </div>
                        <hr className="border-gray-300 dark:border-gray-600" />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            Net (Income - Expense):
                          </span>
                          <span
                            className={`text-xl font-bold ${
                              thisWeekNet >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isLoadingDepositAnalytics || isLoadingAnalytics
                              ? "..."
                              : formatCurrency(thisWeekNet)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Page;
