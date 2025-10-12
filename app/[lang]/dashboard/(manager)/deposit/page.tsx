"use client";
import React, { useState } from "react";
import Image from "next/image";
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
} from "@heroui/react";
import {
  getDeposit,
  approveDeposit,
  rejectDeposit,
  depositAnalytics,
  rollbackDeposit,
} from "@/actions/manager/deposit";
import { controllerDepositDashboard } from "@/actions/controller/deposit";
import { addToast } from "@heroui/toast";
// import z from "zod";
import { useLocalization } from "@/hooks/useLocalization";
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  DollarSign,
  Calendar,
  Trash2,
} from "lucide-react";

const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder.png";
  return `/api/filedata/${encodeURIComponent(url)}`;
};

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
  const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<{
    id: string;
    status: string;
  } | null>(null);

  const [controllerData] = useData(controllerDepositDashboard, () => {});
  const [depositAnalyticsData, isLoadingAnalytics] = useData(
    depositAnalytics,
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

  // Delete/Rollback mutation
  const [deleteAction, isLoadingDelete] = useMutation(
    rollbackDeposit,
    (state) => {
      setProcessingDeleteId(null);
      setDeleteModalOpen(false);
      setDepositToDelete(null);
      refresh();
      addToast({
        title: "Delete Deposit",
        description: state?.message || "Deposit deleted successfully.",
      });
    }
  );

  // Handle delete confirmation
  const handleDeleteClick = (id: string, status: string) => {
    setDepositToDelete({ id, status });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (depositToDelete) {
      setProcessingDeleteId(depositToDelete.id);
      deleteAction(depositToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDepositToDelete(null);
  };

  const rows = (data?.data || []).map((deposit) => ({
    key: String(deposit.id),
    id: String(deposit.id),
    studentFullName: deposit.depositedTo
      ? `${deposit.depositedTo.firstName} ${deposit.depositedTo.fatherName} ${deposit.depositedTo.lastName}`
      : "N/A",
    studentPhone: deposit.depositedTo?.phoneNumber || "N/A",
    teacherName: deposit.depositedTo?.roomStudent?.[0]?.teacher
      ? `${deposit.depositedTo.roomStudent[0].teacher.firstName} ${deposit.depositedTo.roomStudent[0].teacher.fatherName} ${deposit.depositedTo.roomStudent[0].teacher.lastName}`
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
          <Image
            src={formatImageUrl(item.photo)}
            alt="Proof"
            width={40}
            height={40}
            style={{
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          {/* Delete button for all statuses */}
          <Button
            size="sm"
            color="danger"
            variant="bordered"
            startContent={<Trash2 className="h-4 w-4" />}
            onClick={() => handleDeleteClick(item.id, item.status)}
            isLoading={isLoadingDelete && processingDeleteId === item.id}
          >
            {t("common.delete")}
          </Button>
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

        {/* Deposit Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* This Month Deposit Amount */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  {t("analytics.deposit.thisMonthAmount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(
                          depositAnalyticsData?.thisMonthDepositAmount || 0
                        )
                      )}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {t("analytics.deposit.currentMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Year Deposit Amount */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  {t("analytics.deposit.thisYearAmount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(depositAnalyticsData?.thisYearDepositAmount || 0)
                      )}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {t("analytics.deposit.currentYear")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Week Deposit Amount */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  {t("analytics.deposit.thisWeekAmount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(depositAnalyticsData?.thisWeekDepositAmount || 0)
                      )}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {t("analytics.deposit.currentWeek")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Deposit Count */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl shadow-lg border border-amber-200 dark:border-amber-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 dark:text-amber-200 text-sm font-medium">
                  {t("analytics.deposit.thisMonthCount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : depositAnalyticsData?.thisMonthDepositCount || 0}
                </p>
                <p className="text-amber-100 dark:text-amber-200 text-xs mt-1">
                  {t("analytics.deposit.depositsThisMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Deposit Amount */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 dark:text-red-200 text-sm font-medium">
                  {t("analytics.deposit.totalAmount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(depositAnalyticsData?.totalDepositAmount || 0)
                      )}
                </p>
                <p className="text-red-100 dark:text-red-200 text-xs mt-1">
                  {t("analytics.deposit.allTimeDeposits")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
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
                {t("deposit.confirmDelete")}
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              {depositToDelete?.status === "approved" ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300">
                    {t("deposit.deleteApprovedWarning")}
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">
                          {t("deposit.balanceWarning")}
                        </p>
                        <p className="mt-1">
                          {t("deposit.balanceWarningDetail")}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {t("deposit.deleteConfirmMessage")}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("deposit.cannotUndo")}
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
