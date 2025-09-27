"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import { Button, Input, Modal } from "@heroui/react";
import {
  getMonthsPayment,
  getYearsPayment,
  paymentDashboard,
} from "@/actions/manager/payment";
// import { controllerDepositDashboard } from "@/actions/controller/deposit";
import { addToast } from "@heroui/toast";
import z from "zod";
import { Calendar } from "@heroui/react";
import { X } from "lucide-react";
import { parseDate, DateValue } from "@internationalized/date";

function Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [pageSize, setPageSize] = useState(10);

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

  // Prepare year and month options
  const yearOptions =
    Array.isArray(yearsData) && yearsData.length > 0
      ? yearsData
          .filter((y: any) => {
            // If yearsData is array of objects, check for year property
            if (typeof y === "object" && y !== null && "year" in y) {
              return y.year != null && y.year !== "";
            }
            return y != null && y !== "";
          })
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
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const rows = (data?.data || []).map((payment) => ({
    key: String(payment.id),
    id: String(payment.id),
    studentFullName: payment.user
      ? `${payment.user.firstName} ${payment.user.fatherName} ${payment.user.lastName}`
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
      label: "Student Name",
      renderCell: (item: any) => item.studentFullName,
    },
    {
      key: "year",
      label: "Year",
      renderCell: (item: any) => item.year,
    },
    {
      key: "month",
      label: "Month",
      renderCell: (item: any) => {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        return monthNames[Number(item.month) - 1] || item.month;
      },
    },
    {
      key: "amount",
      label: "Amount",
      renderCell: (item: any) => (
        <span>${Number(item.amount).toLocaleString()}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
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
    <div className="overflow-x-auto px-2">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-2 overflow-hidden">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          Deposit Management
        </h1>
        {/* Dashboard summary */}
        <div className="mb-4 w-full">
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2">
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Total Payment</div>
              <div className="font-bold text-lg text-blue-700">
                {isLoadingDashboard
                  ? "..."
                  : typeof dashboardData?.totalPayment === "number"
                  ? dashboardData.totalPayment
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">This Month Payment</div>
              <div className="font-bold text-lg text-green-600">
                {isLoadingDashboard
                  ? "..."
                  : typeof dashboardData?.thisMonthPayment === "number"
                  ? dashboardData.thisMonthPayment
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Max Payment</div>
              <div className="font-bold text-lg text-purple-700">
                {isLoadingDashboard
                  ? "..."
                  : typeof dashboardData?.maxValuePayment === "number"
                  ? dashboardData.maxValuePayment
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Min Payment</div>
              <div className="font-bold text-lg text-pink-700">
                {isLoadingDashboard
                  ? "..."
                  : typeof dashboardData?.minValuePayment === "number"
                  ? dashboardData.minValuePayment
                  : 0}
              </div>
            </div>
          </div>
        </div>
        {/* Filter and Add button row */}
        <div className="p-1 bg-default-50/30 rounded-xl flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Year filter */}
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={year || ""}
              onChange={(e) => {
                setYear(e.target.value || undefined);
                setPage(1);
              }}
              className="px-3 py-2 rounded border border-gray-300 text-sm"
              style={{ minWidth: 80 }}
              disabled={isLoadingYears}
            >
              <option value="">All</option>
              {yearOptions.map((opt: { value: string; label: string }) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Month filter */}
            <label className="text-sm font-medium text-gray-700 ml-2">
              Month:
            </label>
            <select
              value={month || ""}
              onChange={(e) => {
                setMonth(e.target.value || undefined);
                setPage(1);
              }}
              className="px-3 py-2 rounded border border-gray-300 text-sm"
              style={{ minWidth: 80 }}
            >
              <option value="">All</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Removed search input and buttons */}
          </div>
        </div>
        {/* Table */}
        <div className="w-full overflow-x-auto">
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
  );
}

export default Page;
