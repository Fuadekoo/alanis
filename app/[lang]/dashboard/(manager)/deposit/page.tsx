"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import { Button } from "@heroui/react";
import {
  getDeposit,
  approveDeposit,
  rejectDeposit,
} from "@/actions/manager/deposit";
import { controllerDepositDashboard } from "@/actions/controller/deposit";
import { addToast } from "@heroui/toast";
import z from "zod";
import { useLocalization } from "@/hooks/useLocalization";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";

function Page() {
  const { t, formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterByPayment, setFilterByPayment] = useState<string>("all");
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const filterOptions = [
    { label: t("deposit.all"), value: "all" },
    { label: t("deposit.pending"), value: "pending" },
    { label: t("deposit.approved"), value: "approved" },
    { label: t("deposit.rejected"), value: "rejected" },
  ];
  const [processingApproveId, setProcessingApproveId] = useState<string | null>(
    null
  );
  const [processingRejectId, setProcessingRejectId] = useState<string | null>(
    null
  );

  const [controllerData, isLoadingController] = useData(
    controllerDepositDashboard,
    () => {}
  );

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getDeposit,
    () => {},
    filterByPayment,
    page,
    pageSize,
    search,
    startDate,
    endDate
  );

  // Approve mutation
  const [approveAction, isLoadingApprove] = useMutation(
    approveDeposit,
    (state) => {
      setProcessingApproveId(null);
      refresh();
      addToast({
        title: "Approve Payment",
        description: state?.error || "Deposit approved successfully.",
      });
    }
  );

  // Reject mutation
  const [rejectAction, isLoadingReject] = useMutation(
    rejectDeposit,
    (state) => {
      setProcessingRejectId(null);
      refresh();
      addToast({
        title: "Reject Payment",
        description: state?.error || "Deposit rejected successfully.",
      });
    }
  );

  const rows = (data?.data || []).map((deposit) => ({
    key: String(deposit.id),
    id: String(deposit.id),
    studentFullName: deposit.depositedTo
      ? `${deposit.depositedTo.firstName} ${deposit.depositedTo.fatherName} ${deposit.depositedTo.lastName}`
      : "N/A",
    amount: deposit.amount != null ? String(deposit.amount) : "",
    photo: deposit.photo ?? "",
    status: deposit.status ?? "",
    createdAt: deposit.createdAt ?? "",
  }));

  const columns = [
    {
      key: "studentFullName",
      label: t("deposit.studentName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.studentFullName,
    },

    {
      key: "amount",
      label: t("deposit.amount"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span>{formatCurrency(Number(item.amount))}</span>
      ),
    },
    {
      key: "photo",
      label: t("deposit.photo"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.photo ? (
          <img
            src={item.photo}
            alt="Proof"
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          t("deposit.noImage")
        ),
    },
    {
      key: "status",
      label: t("deposit.status"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="capitalize">{t(`deposit.${item.status}`)}</span>
      ),
    },
    {
      key: "createdAt",
      label: t("deposit.createdAt"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
    {
      key: "actions",
      label: t("common.actions"),
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          {item.status === "pending" && (
            <>
              <Button
                size="sm"
                color="success"
                variant="flat"
                onClick={() => {
                  setProcessingApproveId(item.id);
                  approveAction(String(item.id));
                }}
                isLoading={isLoadingApprove && processingApproveId === item.id}
              >
                {t("deposit.approve")}
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onClick={() => {
                  setProcessingRejectId(item.id);
                  rejectAction(String(item.id));
                }}
                isLoading={isLoadingReject && processingRejectId === item.id}
              >
                {t("deposit.reject")}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Add/Edit buttons and modal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto px-2 py-6">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t("deposit.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("deposit.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Deposits Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  {t("deposit.totalDeposits")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.totalDeposits === "number"
                    ? controllerData.totalDeposits
                    : 0}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {t("deposit.depositHistory")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Approved Deposits Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  {t("deposit.approvedDeposits")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.approvedDeposits === "number"
                    ? controllerData.approvedDeposits
                    : 0}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {t("deposit.approved")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Rejected Deposits Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 dark:text-red-200 text-sm font-medium">
                  {t("deposit.rejectedDeposits")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.rejectedDeposits === "number"
                    ? controllerData.rejectedDeposits
                    : 0}
                </p>
                <p className="text-red-100 dark:text-red-200 text-xs mt-1">
                  {t("deposit.rejected")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Pending Deposits Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl shadow-lg border border-amber-200 dark:border-amber-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 dark:text-amber-200 text-sm font-medium">
                  {t("deposit.pendingDeposits")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.pendingDeposits === "number"
                    ? controllerData.pendingDeposits
                    : 0}
                </p>
                <p className="text-amber-100 dark:text-amber-200 text-xs mt-1">
                  {t("deposit.pending")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* This Month Deposits */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  {t("deposit.thisMonthDeposits")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.thisMonthDeposits === "number"
                    ? controllerData.thisMonthDeposits
                    : 0}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {t("deposit.thisMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Rejected */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-lg border border-orange-200 dark:border-orange-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 dark:text-orange-200 text-sm font-medium">
                  {t("deposit.thisMonthRejected")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.thisMonthRejected === "number"
                    ? controllerData.thisMonthRejected
                    : 0}
                </p>
                <p className="text-orange-100 dark:text-orange-200 text-xs mt-1">
                  {t("deposit.thisMonthRejected")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Pending */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm font-medium">
                  {t("deposit.thisMonthPending")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {typeof controllerData?.thisMonthPending === "number"
                    ? controllerData.thisMonthPending
                    : 0}
                </p>
                <p className="text-indigo-100 dark:text-indigo-200 text-xs mt-1">
                  {t("deposit.thisMonthPending")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Deposit Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("deposit.depositHistory")}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("deposit.viewAllDeposits")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t("common.filter")}:
                </span>
                <select
                  value={filterByPayment}
                  onChange={(e) => {
                    setFilterByPayment(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ minWidth: 120 }}
                >
                  {filterOptions.map((opt) => (
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
