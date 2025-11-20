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
  Tabs,
  Tab,
  Skeleton,
  Chip,
} from "@heroui/react";
import {
  getMonthsPayment,
  getYearsPayment,
  paymentDashboard,
  rollbackMonthlyPayment,
  getUnpaidStudents,
} from "@/actions/manager/payment";
import { addToast } from "@heroui/toast";
import { useLocalization } from "@/hooks/useLocalization";
import {
  TrendingUp,
  Calendar as CalendarIcon,
  CreditCard,
  BarChart3,
  Users,
  DollarSign,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

function Page() {
  const { t, getMonthName, formatCurrency } = useLocalization();
  const [activeTab, setActiveTab] = useState<string>("paid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [pageSize, setPageSize] = useState(10);
  const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{
    id: string;
    amount: string;
  } | null>(null);

  // Unpaid tab states
  const [unpaidMonth, setUnpaidMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [unpaidYear, setUnpaidYear] = useState<number>(
    new Date().getFullYear()
  );
  const [unpaidSearch, setUnpaidSearch] = useState("");
  const [unpaidPage, setUnpaidPage] = useState(1);
  const [unpaidPageSize, setUnpaidPageSize] = useState(10);

  const [dashboardData, isLoadingDashboard] = useData(
    paymentDashboard,
    () => {}
  );

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getMonthsPayment,
    () => {},
    search,
    page,
    pageSize,
    month,
    year,
    startDate,
    endDate
  );

  const [yearsData, isLoadingYears] = useData(getYearsPayment, () => {});

  // Get unpaid students data
  const [unpaidData, isLoadingUnpaid] = useData(
    getUnpaidStudents,
    () => {},
    unpaidMonth,
    unpaidYear,
    unpaidPage,
    unpaidPageSize
  );

  // Reset page to 1 when month or year changes
  useEffect(() => {
    setUnpaidPage(1);
  }, [unpaidMonth, unpaidYear]);

  // Delete/Rollback payment mutation
  const [deleteAction, isLoadingDelete] = useMutation(
    rollbackMonthlyPayment,
    (state) => {
      setProcessingDeleteId(null);
      setDeleteModalOpen(false);
      setPaymentToDelete(null);
      refresh();
      addToast({
        title: "Delete Payment",
        description: state?.message || "Payment deleted successfully.",
      });
    }
  );

  // Handle delete confirmation
  const handleDeleteClick = (id: string, amount: string) => {
    setPaymentToDelete({ id, amount });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (paymentToDelete) {
      setProcessingDeleteId(paymentToDelete.id);
      deleteAction(paymentToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setPaymentToDelete(null);
  };

  // Prepare year and month options
  const yearOptions =
    Array.isArray(yearsData) && yearsData.length > 0
      ? yearsData
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((y: any) => {
            // If yearsData is array of objects, check for year property
            if (typeof y === "object" && y !== null && "year" in y) {
              return y.year != null && y.year !== "";
            }
            return y != null && y !== "";
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((y: any) => {
            // If yearsData is array of objects, extract year property
            const yearValue =
              typeof y === "object" && y !== null && "year" in y ? y.year : y;
            return {
              value: String(yearValue),
              label: String(yearValue),
            };
          })
      : [];
  const monthOptions = [
    { value: "1", label: t("months.january") },
    { value: "2", label: t("months.february") },
    { value: "3", label: t("months.march") },
    { value: "4", label: t("months.april") },
    { value: "5", label: t("months.may") },
    { value: "6", label: t("months.june") },
    { value: "7", label: t("months.july") },
    { value: "8", label: t("months.august") },
    { value: "9", label: t("months.september") },
    { value: "10", label: t("months.october") },
    { value: "11", label: t("months.november") },
    { value: "12", label: t("months.december") },
  ];

  const rows = (data?.data || []).map((payment) => ({
    key: String(payment.id),
    id: String(payment.id),
    studentFullName: payment.user
      ? `${payment.user.firstName} ${payment.user.fatherName} ${payment.user.lastName}`
      : "N/A",
    studentPhone: payment.user?.phoneNumber || "N/A",
    teacherName: payment.user?.roomStudent?.[0]?.teacher
      ? `${payment.user.roomStudent[0].teacher.firstName} ${payment.user.roomStudent[0].teacher.fatherName} ${payment.user.roomStudent[0].teacher.lastName}`
      : "N/A",
    amount:
      payment.perMonthAmount != null ? String(payment.perMonthAmount) : "",
    year: payment.year,
    month: payment.month,
    createdAt: payment.createdAt ?? "",
  }));

  const columns = [
    {
      key: "studentFullName",
      label: t("deposit.studentName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.studentFullName,
    },
    {
      key: "studentPhone",
      label: t("deposit.studentPhone"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.studentPhone,
    },
    {
      key: "teacherName",
      label: t("deposit.teacherName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.teacherName,
    },
    {
      key: "year",
      label: t("payment.year"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.year,
    },
    {
      key: "month",
      label: t("payment.month"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => {
        return getMonthName(Number(item.month));
      },
    },
    {
      key: "amount",
      label: t("payment.amount"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span>{formatCurrency(Number(item.amount))}</span>
      ),
    },
    {
      key: "createdAt",
      label: t("payment.paymentDate"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
    {
      key: "actions",
      label: t("common.actions"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <Button
          size="sm"
          color="danger"
          variant="bordered"
          startContent={<Trash2 className="h-4 w-4" />}
          onClick={() => handleDeleteClick(item.id, item.amount)}
          isLoading={isLoadingDelete && processingDeleteId === item.id}
        >
          {t("common.delete")}
        </Button>
      ),
    },
  ];

  // Unpaid students columns
  const unpaidColumns = [
    {
      key: "studentFullName",
      label: t("deposit.studentName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {item.studentFullName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            @{item.username}
          </span>
        </div>
      ),
    },
    {
      key: "studentPhone",
      label: t("deposit.studentPhone"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="text-gray-700 dark:text-gray-300">
          {item.studentPhone}
        </span>
      ),
    },
    {
      key: "teacherName",
      label: t("deposit.teacherName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="text-gray-700 dark:text-gray-300">
          {item.teacherName}
        </span>
      ),
    },
    {
      key: "learningTime",
      label: t("payment.learningTime") || "Learning Time",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="text-gray-700 dark:text-gray-300">
          {item.learningTime}
        </span>
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      renderCell: () => (
        <Chip color="danger" size="sm" variant="flat">
          {t("payment.unpaid") || "Unpaid"}
        </Chip>
      ),
    },
  ];

  // Map unpaid students data to table rows
  const unpaidRows = (unpaidData?.data || [])
    .filter((student) => {
      if (!unpaidSearch) return true;
      const searchLower = unpaidSearch.toLowerCase();
      const fullName = `${student.firstName} ${student.fatherName || ""} ${
        student.lastName
      }`.toLowerCase();
      const username = (student.username || "").toLowerCase();
      const phone = (student.phoneNumber || "").toLowerCase();
      return (
        fullName.includes(searchLower) ||
        username.includes(searchLower) ||
        phone.includes(searchLower)
      );
    })
    .map((student) => ({
      key: student.id,
      id: student.id,
      studentFullName: `${student.firstName} ${student.fatherName || ""} ${
        student.lastName
      }`,
      username: student.username || "N/A",
      studentPhone: student.phoneNumber || "N/A",
      teacherName:
        student.roomStudent && student.roomStudent.length > 0
          ? `${student.roomStudent[0].teacher.firstName} ${
              student.roomStudent[0].teacher.fatherName || ""
            } ${student.roomStudent[0].teacher.lastName}`
          : "N/A",
      learningTime:
        student.roomStudent && student.roomStudent.length > 0
          ? `${student.roomStudent[0].time || "N/A"} (${
              student.roomStudent[0].duration || "N/A"
            }h)`
          : "N/A",
    }));

  // Date filter handler
  const handleDateChange = ({
    startDate,
    endDate,
  }: {
    startDate: string | null;
    endDate: string | null;
  }) => {
    setStartDate(startDate ? new Date(startDate) : undefined);
    setEndDate(endDate ? new Date(endDate) : undefined);
    setPage(1);
  };

  // Add/Edit buttons and modal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto px-2 py-6">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t("payment.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("payment.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* This Month Payment Person Count */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  {t("analytics.payment.thisMonthPersonCount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : dashboardData?.thisMonthPaymentPersonCount || 0}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {t("analytics.payment.uniqueStudentsPaid")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Payment ETB */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  {t("analytics.payment.thisMonthETB")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : formatCurrency(
                        Number(dashboardData?.thisMonthPayment || 0)
                      )}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {t("analytics.payment.currentMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Year Payment ETB */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  {t("analytics.payment.thisYearETB")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : formatCurrency(
                        Number(dashboardData?.thisYearPayment || 0)
                      )}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {t("analytics.payment.currentYear")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Payment ETB */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl shadow-lg border border-amber-200 dark:border-amber-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 dark:text-amber-200 text-sm font-medium">
                  {t("analytics.payment.totalETB")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : formatCurrency(Number(dashboardData?.totalPayment || 0))}
                </p>
                <p className="text-amber-100 dark:text-amber-200 text-xs mt-1">
                  {t("analytics.payment.allTime")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Payments Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  {t("payment.totalPayments")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : typeof dashboardData?.totalPayment === "number"
                    ? dashboardData.totalPayment
                    : 0}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {t("payment.monthlyPaymentsMade")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Payment Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  {t("payment.thisMonth")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : typeof dashboardData?.thisMonthPayment === "number"
                    ? dashboardData.thisMonthPayment
                    : 0}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {t("payment.currentMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Max Payment Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  {t("payment.maxPayment")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : typeof dashboardData?.maxValuePayment === "number"
                    ? formatCurrency(dashboardData.maxValuePayment)
                    : formatCurrency(0)}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {t("payment.highestAmount")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Min Payment Card */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 rounded-xl shadow-lg border border-pink-200 dark:border-pink-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 dark:text-pink-200 text-sm font-medium">
                  {t("payment.minPayment")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingDashboard
                    ? "..."
                    : typeof dashboardData?.minValuePayment === "number"
                    ? formatCurrency(dashboardData.minValuePayment)
                    : formatCurrency(0)}
                </p>
                <p className="text-pink-100 dark:text-pink-200 text-xs mt-1">
                  {t("payment.lowestAmount")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Payment Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Tabs
            aria-label="Payment tabs"
            selectedKey={activeTab}
            onSelectionChange={(key: React.Key) => setActiveTab(key as string)}
            color="primary"
            variant="underlined"
            classNames={{
              tabList:
                "gap-6 w-full relative rounded-none p-6 border-b border-divider bg-gray-50 dark:bg-gray-800/50",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-4 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
          >
            <Tab
              key="paid"
              title={
                <div className="flex items-center space-x-2">
                  <CheckCircle className="size-4" />
                  <span>{t("payment.paid") || "Paid"}</span>
                </div>
              }
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {t("payment.paymentHistory") || "Payment History"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t("payment.viewPaidPayments") ||
                        "View all paid payments"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Year filter */}
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("payment.year")}:
                    </label>
                    <select
                      value={year || ""}
                      onChange={(e) => {
                        setYear(e.target.value || undefined);
                        setPage(1);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ minWidth: 80 }}
                      disabled={isLoadingYears}
                    >
                      <option value="">{t("common.all")}</option>
                      {yearOptions.map(
                        (opt: { value: string; label: string }) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        )
                      )}
                    </select>
                    {/* Month filter */}
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("payment.month")}:
                    </label>
                    <select
                      value={month || ""}
                      onChange={(e) => {
                        setMonth(e.target.value || undefined);
                        setPage(1);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ minWidth: 80 }}
                    >
                      <option value="">{t("common.all")}</option>
                      {monthOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-gray-900">
                <CustomTable
                  columns={columns}
                  rows={rows.map((row) =>
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
                  startDate={startDate?.toISOString().split("T")[0]}
                  endDate={endDate?.toISOString().split("T")[0]}
                  onDateChange={handleDateChange}
                />
              </div>
            </Tab>

            <Tab
              key="unpaid"
              title={
                <div className="flex items-center space-x-2">
                  <XCircle className="size-4" />
                  <span>{t("payment.unpaid") || "Unpaid"}</span>
                </div>
              }
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {t("payment.unpaidStudents") || "Unpaid Students"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t("payment.studentsWhoHaventPaid") ||
                        "Students who haven't paid for selected month"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Year selector */}
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("payment.year")}:
                    </label>
                    <select
                      value={unpaidYear}
                      onChange={(e) => {
                        setUnpaidYear(Number(e.target.value));
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ minWidth: 100 }}
                    >
                      {yearOptions.map(
                        (opt: { value: string; label: string }) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        )
                      )}
                    </select>
                    {/* Month selector */}
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t("payment.month")}:
                    </label>
                    <select
                      value={unpaidMonth}
                      onChange={(e) => {
                        setUnpaidMonth(Number(e.target.value));
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ minWidth: 120 }}
                    >
                      {monthOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-gray-900">
                {unpaidRows.length > 0 || (unpaidData?.data && unpaidData.data.length > 0) ? (
                  <>
                    <CustomTable
                      columns={unpaidColumns}
                      rows={unpaidRows}
                      totalRows={
                        unpaidSearch
                          ? unpaidRows.length
                          : unpaidData?.pagination?.totalRecords || unpaidData?.totalCount || 0
                      }
                      page={unpaidPage}
                      pageSize={unpaidPageSize}
                      onPageChange={setUnpaidPage}
                      onPageSizeChange={(n) => {
                        setUnpaidPageSize(n);
                        setUnpaidPage(1);
                      }}
                      searchValue={unpaidSearch}
                      onSearch={(val) => {
                        setUnpaidSearch(val);
                        setUnpaidPage(1);
                      }}
                      isLoading={isLoadingUnpaid}
                    />

                    {/* Unpaid Summary */}
                    <div className="mt-4 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-danger/20 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-danger-700 dark:text-danger-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-danger-700 dark:text-danger-400">
                            {t("payment.unpaidCount") || "Unpaid Students"}:{" "}
                            <span className="text-lg">
                              {unpaidData?.totalCount || 0}
                            </span>
                          </p>
                          <p className="text-xs text-danger-600 dark:text-danger-500">
                            {t("payment.forMonth") || "for"}{" "}
                            {getMonthName(unpaidMonth)} {unpaidYear}
                          </p>
                        </div>
                      </div>
                      <Chip color="danger" size="lg" variant="flat">
                        {unpaidData?.totalCount || 0} /{" "}
                        {unpaidData?.totalCount || 0}
                      </Chip>
                    </div>
                  </>
                ) : isLoadingUnpaid ? (
                  <Skeleton className="w-full h-96 rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle className="size-20 text-success-300 mb-4" />
                    <h3 className="text-xl font-semibold text-success-600 mb-2">
                      {t("payment.allPaid") || "All Students Paid!"}
                    </h3>
                    <p className="text-sm text-default-400 max-w-md">
                      {t("payment.allStudentsPaidForMonth") ||
                        `All active students have paid for ${getMonthName(
                          unpaidMonth
                        )} ${unpaidYear}`}
                    </p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-red-600 dark:text-red-400">
                {t("payment.confirmDelete")}
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                {t("payment.deleteWarning")}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold">
                      {t("payment.balanceRefund")}
                    </p>
                    <p className="mt-1">{t("payment.balanceRefundDetail")}</p>
                    {paymentToDelete && (
                      <p className="mt-2 font-semibold">
                        {t("payment.refundAmount")}:{" "}
                        {formatCurrency(Number(paymentToDelete.amount))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("payment.cannotUndo")}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onPress={handleCancelDelete}
              isDisabled={isLoadingDelete}
            >
              {t("common.cancel")}
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDelete}
              isLoading={isLoadingDelete}
              startContent={!isLoadingDelete && <Trash2 className="h-4 w-4" />}
            >
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Page;
