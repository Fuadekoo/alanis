"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import { Button, Input, Modal } from "@heroui/react";
import { getMonthsPayment, getYearsPayment } from "@/actions/manager/payment";
import { controllerDepositDashboard } from "@/actions/controller/deposit";
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

  const [controllerData, isLoadingController] = useData(
    controllerDepositDashboard,
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
            const yearValue = typeof y === "object" && y !== null && "year" in y ? y.year : y;
            return {
              value: String(yearValue),
              label: String(yearValue),
            };
          })
      : [];
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}`,
  }));

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
      renderCell: (item: any) => item.month,
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
          <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-7 gap-2">
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Total Deposits</div>
              <div className="font-bold text-lg text-blue-700">
                {typeof controllerData?.totalDeposits === "number"
                  ? controllerData.totalDeposits
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Approved</div>
              <div className="font-bold text-lg text-green-600">
                {typeof controllerData?.approvedDeposits === "number"
                  ? controllerData.approvedDeposits
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Rejected</div>
              <div className="font-bold text-lg text-red-600">
                {typeof controllerData?.rejectedDeposits === "number"
                  ? controllerData.rejectedDeposits
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">Pending</div>
              <div className="font-bold text-lg text-yellow-600">
                {typeof controllerData?.pendingDeposits === "number"
                  ? controllerData.pendingDeposits
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">This Month</div>
              <div className="font-bold text-lg text-blue-700">
                {typeof controllerData?.thisMonthDeposits === "number"
                  ? controllerData.thisMonthDeposits
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">This Month Rejected</div>
              <div className="font-bold text-lg text-red-600">
                {typeof controllerData?.thisMonthRejected === "number"
                  ? controllerData.thisMonthRejected
                  : 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <div className="text-xs text-gray-500">This Month Pending</div>
              <div className="font-bold text-lg text-yellow-600">
                {typeof controllerData?.thisMonthPending === "number"
                  ? controllerData.thisMonthPending
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
            {/* Search input */}
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 px-3 py-2 rounded border border-gray-300 text-sm"
              style={{ minWidth: 120 }}
            />
            <Button
              color="primary"
              className="ml-2"
              onClick={() => {
                setPage(1);
                refresh();
              }}
            >
              Search
            </Button>
            <Button
              variant="flat"
              className="ml-2"
              onClick={() => {
                setYear(undefined);
                setMonth(undefined);
                setSearch("");
                setStartDate(undefined);
                setEndDate(undefined);
                setPage(1);
                refresh();
              }}
            >
              Clear
            </Button>
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
