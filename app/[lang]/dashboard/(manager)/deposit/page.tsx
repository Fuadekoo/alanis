"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import {useRegistration} from "@/hooks/useRegistration";
import { Button, Input, Modal } from "@heroui/react";
import {
  getDeposit,
  approveDeposit,
  rejectDeposit,
} from "@/actions/manager/deposit";
import { addToast } from "@heroui/toast";
import z from "zod";

const depositSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // ...add other fields as needed...
});

function PaymentListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
const [filterByPayment, setFilterByPayment] = useState<string>("all");
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

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getDeposit,
    () => {},
    filterByPayment,
    page,
    pageSize,
    search
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

  // Registration (add/edit) modal logic
  const form = useRegistration(
    () => Promise.resolve(), // replace with your add/edit deposit function
    depositSchema,
    (state) => {
      refresh();
      form.onOpenChange(false);
      addToast({
        title: "Deposit",
        description: state?.error || "Operation successful.",
      });
    }
  );

  const rows = (data?.data || []).map((deposit) => ({
    key: String(deposit.id),
    id: String(deposit.id),
    amount: deposit.amount != null ? String(deposit.amount) : "",
    createdAt: deposit.createdAt ?? "",
    status: deposit.status ?? "",
    photo: deposit.photo ?? "",
    user:
      deposit.depositedTo?.firstName ||
      deposit.depositedTo?.phoneNumber ||
      "N/A",
  }));

  // In columns, update status check to match your backend ("pending", "approved", "rejected")
  const columns = [
    // ...existing columns...
    {
      key: "actions",
      label: "Actions",
      renderCell: (item) => (
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        Deposit Management
      </h1>
      <div className="mb-4 flex gap-2">
        <Button onClick={form.add}>Add Deposit</Button>
        {/* Example edit button for the first row */}
        {rows[0] && (
          <Button onClick={() => form.edit(rows[0])}>Edit First Deposit</Button>
        )}
      </div>
      <CustomTable
        columns={[
          // ...your columns...
          {
            key: "actions",
            label: "Actions",
            renderCell: (item) => (
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
                      isLoading={
                        isLoadingApprove && processingApproveId === item.id
                      }
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
                      isLoading={
                        isLoadingReject && processingRejectId === item.id
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
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
      <Modal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
        <form onSubmit={form.onSubmit} className="p-4 flex flex-col gap-4">
          <Input {...form.register("name")} label="Name" />
          {/* Add more fields as needed */}
          <Button type="submit" isLoading={form.isLoading}>
            Submit
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default PaymentListPage;
