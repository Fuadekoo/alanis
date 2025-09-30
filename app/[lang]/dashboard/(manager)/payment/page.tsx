"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
// import useMutation from "@/hooks/useMutation";
// import { Button, Input, Modal } from "@heroui/react";
import {
  getMonthsPayment,
  getYearsPayment,
  paymentDashboard,
} from "@/actions/manager/payment";
// import { controllerDepositDashboard } from "@/actions/controller/deposit";
// import { addToast } from "@heroui/toast";
// import { Calendar } from "@heroui/react";
// import { X } from "lucide-react";
// import { parseDate, DateValue } from "@internationalized/date";
import { useLocalization } from "@/hooks/useLocalization";
import {
  TrendingUp,
  Calendar as CalendarIcon,
  CreditCard,
  BarChart3,
} from "lucide-react";

function Page() {
  const { t, getMonthName, formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  // const [showDateFilter, setShowDateFilter] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const [dashboardData, isLoadingDashboard] = useData(
    paymentDashboard,
    () => {}
  );

  // Data fetching
  const [data, isLoading] = useData(
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
  ];

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
        {/* Payment Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("payment.title")}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("payment.subtitle")}
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
                  {yearOptions.map((opt: { value: string; label: string }) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
        </div>
      </div>
    </div>
  );
}

export default Page;
