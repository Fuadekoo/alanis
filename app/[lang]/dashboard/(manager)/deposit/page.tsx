"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import { Button, Input, Modal } from "@heroui/react";
import {
  getDeposit,
  approveDeposit,
  rejectDeposit,
} from "@/actions/manager/deposit";
import { controllerDepositDashboard } from "@/actions/controller/deposit";
import { addToast } from "@heroui/toast";
import z from "zod";

function Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterByPayment, setFilterByPayment] = useState<string>("all");
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approve", value: "approved" },
    { label: "Reject", value: "rejected" },
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
      label: "Student Name",
      renderCell: (item: any) => item.studentFullName,
    },

    {
      key: "amount",
      label: "Amount",
      renderCell: (item: any) => (
        <span>${Number(item.amount).toLocaleString()}</span>
      ),
    },
    {
      key: "photo",
      label: "Photo",
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
          "No Photo"
        ),
    },
    {
      key: "status",
      label: "Status",
      renderCell: (item: any) => (
        <span className="capitalize">{item.status}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
    {
      key: "actions",
      label: "Actions",
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
                Approve
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
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

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
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filterByPayment}
              onChange={(e) => {
                setFilterByPayment(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded border border-gray-300 text-sm"
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
        {/* Table */}
        <div className="w-full overflow-x-auto">
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
  );
}

export default Page;
