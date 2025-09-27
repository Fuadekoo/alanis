"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import { getPayment } from "@/actions/student/payment";
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

function Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  // Fetch payment data
  const [data, isLoading, refresh] = useData(
    getPayment,
    () => {},
    page,
    pageSize
  );

  // Prepare payment data for table
  const rows = (data?.data || []).map((payment) => ({
    key: String(payment.id),
    id: String(payment.id),
    year: payment.year,
    month: payment.month,
    amount:
      payment.perMonthAmount != null ? String(payment.perMonthAmount) : "",
    createdAt: payment.createdAt ?? "",
  }));

  // Get current month and year for display
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const columns = [
    {
      key: "year",
      label: "Year",
      renderCell: (item: any) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {item.year}
        </span>
      ),
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
        const monthName = monthNames[Number(item.month) - 1] || item.month;
        const paymentYear = Number(item.year);
        const paymentMonth = Number(item.month);

        // Determine status based on year and month
        let status = "";
        let statusClass = "";
        let statusIcon = null;

        if (paymentYear === currentYear && paymentMonth === currentMonth) {
          status = "Current";
          statusClass =
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
          statusIcon = <Clock className="h-3 w-3" />;
        } else if (
          paymentYear > currentYear ||
          (paymentYear === currentYear && paymentMonth > currentMonth)
        ) {
          status = "Future";
          statusClass =
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
          statusIcon = <AlertCircle className="h-3 w-3" />;
        } else {
          status = "Past";
          statusClass =
            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
          statusIcon = <CheckCircle className="h-3 w-3" />;
        }

        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {monthName} {paymentYear}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
            >
              {statusIcon}
              {status}
            </span>
          </div>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-700 dark:text-green-400">
            {Number(item.amount).toLocaleString()} ETB
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Payment Date",
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : ""}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-x-auto px-2">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Payment History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View your payment history and track monthly payments
            </p>
          </div>
        </div>

        {/* Payment Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Payment History
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View all your monthly payments
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <CustomTable
              columns={columns}
              rows={rows}
              totalRows={data?.pagination?.totalRecords || 0}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setPage(1);
              }}
              searchValue={search}
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
              isLoading={isLoading}
              enableDateFilter={true}
              startDate={startDate}
              endDate={endDate}
              onDateChange={({ startDate, endDate }) => {
                setStartDate(startDate || undefined);
                setEndDate(endDate || undefined);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
