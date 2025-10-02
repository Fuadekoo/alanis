"use client";
import React, { useState } from "react";
import Image from "next/image";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import { getPayment } from "@/actions/student/payment";
import { useLocalization } from "@/hooks/useLocalization";
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  TrendingUp,
} from "lucide-react";

function Page() {
  const { t, getMonthName, formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Fetch payment data
  const [data, isLoading] = useData(getPayment, () => {}, page, pageSize);

  // Prepare payment data for table
  const rows = (data?.data || []).map((payment) => ({
    key: String(payment.id),
    id: String(payment.id),
    year: payment.year,
    month: payment.month,
  }));

  // Get current month and year for display
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const columns = [
    {
      key: "year",
      label: t("payment.year"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {item.year}
        </span>
      ),
    },
    {
      key: "month",
      label: t("payment.month"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => {
        const monthName = getMonthName(Number(item.month));
        const paymentYear = Number(item.year);
        const paymentMonth = Number(item.month);

        // Determine status based on year and month
        let status = "";
        let statusClass = "";
        let statusIcon = null;

        if (paymentYear === currentYear && paymentMonth === currentMonth) {
          status = t("payment.currentMonth");
          statusClass =
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
          statusIcon = <Clock className="h-3 w-3" />;
        } else if (
          paymentYear > currentYear ||
          (paymentYear === currentYear && paymentMonth > currentMonth)
        ) {
          status = t("payment.futurePayment");
          statusClass =
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
          statusIcon = <AlertCircle className="h-3 w-3" />;
        } else {
          status = t("payment.pastPayment");
          statusClass =
            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
          statusIcon = <CheckCircle className="h-3 w-3" />;
        }

        return (
          <div className="flex items-center gap-3">
            {/* Status indicator dot */}
            <div
              className={`w-3 h-3 rounded-full {
                paymentYear === currentYear && paymentMonth === currentMonth
                  ? "bg-blue-500"
                  : paymentYear > currentYear ||
                    (paymentYear === currentYear && paymentMonth > currentMonth)
                  ? "bg-purple-500"
                  : "bg-gray-400"
              }`}
            />

            {/* Month and year */}
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {monthName} {paymentYear}
              </span>
              {/* Quick status text */}
              <span
                className={`text-xs font-medium ${
                  paymentYear === currentYear && paymentMonth === currentMonth
                    ? "text-blue-600 dark:text-blue-400"
                    : paymentYear > currentYear ||
                      (paymentYear === currentYear &&
                        paymentMonth > currentMonth)
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {paymentYear === currentYear && paymentMonth === currentMonth
                  ? `● ${t("payment.currentMonth")}`
                  : paymentYear > currentYear ||
                    (paymentYear === currentYear && paymentMonth > currentMonth)
                  ? `● ${t("payment.futurePayment")}`
                  : `● ${t("payment.pastPayment")}`}
              </span>
            </div>

            {/* Status badge */}
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
  ];

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
                  {data?.data?.length || 0}
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

          {/* Current Month Status Card */}
          <div
            className={`rounded-xl shadow-lg border p-6 ${
              data?.data?.find(
                (payment) =>
                  payment.month === currentMonth && payment.year === currentYear
              )
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 border-emerald-200 dark:border-emerald-800 text-white"
                : "bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 border-amber-200 dark:border-amber-800 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    data?.data?.find(
                      (payment) =>
                        payment.month === currentMonth &&
                        payment.year === currentYear
                    )
                      ? "text-emerald-100 dark:text-emerald-200"
                      : "text-amber-100 dark:text-amber-200"
                  }`}
                >
                  {t("payment.thisMonth")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {data?.data?.find(
                    (payment) =>
                      payment.month === currentMonth &&
                      payment.year === currentYear
                  )
                    ? t("payment.paid")
                    : t("payment.pending")}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    data?.data?.find(
                      (payment) =>
                        payment.month === currentMonth &&
                        payment.year === currentYear
                    )
                      ? "text-emerald-100 dark:text-emerald-200"
                      : "text-amber-100 dark:text-amber-200"
                  }`}
                >
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                {data?.data?.find(
                  (payment) =>
                    payment.month === currentMonth &&
                    payment.year === currentYear
                ) ? (
                  <CheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <Clock className="h-8 w-8 text-white" />
                )}
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
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900">
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
            />
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div
            className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl max-w-[95vw] max-h-[95vh] flex items-center justify-center border border-gray-200 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={zoomedImageUrl}
              alt="Zoomed payment proof"
              width={800}
              height={600}
              className="block max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-4 right-4 bg-black/50 dark:bg-gray-700/80 text-white dark:text-gray-200 p-2 rounded-full hover:bg-black/75 dark:hover:bg-gray-600/80 focus:outline-none transition-colors"
              aria-label="Close zoomed image"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page;
