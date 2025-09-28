"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import { getDeposit } from "@/actions/student/deposit";
// import z from "zod";
// import { useDebouncedCallback } from "use-debounce";
// import Select from "react-select";
// import chroma from "chroma-js";
// import { X } from "lucide-react";

const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder.png";
  return `/api/filedata/${encodeURIComponent(url)}`;
};
function Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // const [editingId, setEditingId] = useState<string | null>(null);
  const [filterByPayment, setFilterByPayment] = useState<string>("all");

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  // Data fetching
  const [data, isLoading] = useData(
    getDeposit,
    () => {},
    filterByPayment,
    page,
    pageSize,
    search
  );
  // const [balanceData] = useData(getBalance, () => {});

  const rows = (data?.data || []).map((deposit) => ({
    key: String(deposit.id),
    id: String(deposit.id),
    amount: deposit.amount.toString(),
    photo: deposit.photo ?? "",
    status: deposit.status ? String(deposit.status) : "",
    createdAt: deposit.createdAt ?? "",
    studentId: deposit.studentId || "",
  }));

  const columns = [
    {
      key: "amount",
      label: "Amount",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span>
          $
          {parseFloat(item.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "photo",
      label: "Photo",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.photo ? (
          <img
            src={formatImageUrl(item.photo)}
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="capitalize">{item.status}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
    {
      key: "actions",
      label: "Actions",
      renderCell: () => <div className="flex items-center gap-2"></div>,
    },
  ];

  return (
    <div className="overflow-x-auto px-2">
      <div className="w-full mx-auto">
        {/* Balance display */}
        {/* <div className="flex justify-end items-center mb-4">
          <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold shadow">
            Balance:{" "}
            {balanceData?.balance
              ? Number(balanceData.balance).toLocaleString()
              : 0}{" "}
            ETB
          </span>
        </div> */}
        {/* Filter row */}
        <div className="mb-4 flex items-center gap-2">
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
          />
        </div>
      </div>
    </div>
  );
}

export default Page;
