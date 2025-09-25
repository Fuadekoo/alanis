"use client";
import React, { useState } from "react";
import {
  createPayment,
  getPayment,
  rollbackPayment,
} from "@/actions/controller/payment";
import useData from "@/hooks/useData";
import { useRegistration } from "@/hooks/useRegistration";
import useDelete from "@/hooks/useDelete";
import { paymentSchema } from "@/lib/zodSchema";
import CustomTable from "./customTable";
import {
  Button,
  CModal,
  Form,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
} from "@/components/ui/heroui";
import Select from "react-select";

function UserPaymentDetail({ studentId }: { studentId: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch payment data for the student
  const [paymentData, isLoading, refresh] = useData(
    getPayment,
    () => {},
    studentId,
    page,
    pageSize
  );
  const form = useRegistration(createPayment, paymentSchema, (state) => {
    if (state.status) {
      refresh();
    }
  });

  const deletion = useDelete(
    (id: string) => rollbackPayment([id], studentId),
    (state) => {
      if (state.status) {
        refresh();
      }
    }
  );
  const rows = (paymentData?.data || []).map((p: any) => ({
    key: String(p.id),
    id: String(p.id),
    year: p.year,
    month: p.month + 1,
    amount: p.amount != null ? String(p.amount) : "",
    createdAt: p.createdAt ?? "",
  }));

  const columns = [
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
        <span>
          {item.amount ? `$${Number(item.amount).toLocaleString()}` : ""}
        </span>
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
          {/* Add rollback or edit buttons here if needed */}
        </div>
      ),
    },
  ];

  // Add Payment Modal state
  const [amount, setAmount] = useState("");
  // Instead of a single year and months, allow multiple year-month pairs
  const [selectedYearMonths, setSelectedYearMonths] = useState<
    { year: number; month: number }[]
  >([]);

  // Generate year options (e.g., from 2020 to 5 years ahead)
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 2 + i;
    return { value: y, label: String(y) };
  });

  // Month options (always 0-11)
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
  }));

  // For the year/month picker
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonths, setTempMonths] = useState<
    { value: number; label: string }[]
  >([]);

  // Add selected year-month pairs to the main selection, avoiding duplicates
  const handleAddYearMonths = () => {
    const newPairs = tempMonths
      .map((m) => ({ year: tempYear, month: m.value }))
      .filter(
        (pair) =>
          !selectedYearMonths.some(
            (sel) => sel.year === pair.year && sel.month === pair.month
          )
      );
    setSelectedYearMonths([...selectedYearMonths, ...newPairs]);
    setTempMonths([]);
  };

  // Remove a selected year-month pair
  const handleRemoveYearMonth = (year: number, month: number) => {
    setSelectedYearMonths(
      selectedYearMonths.filter((p) => !(p.year === year && p.month === month))
    );
  };

  // Compose monthsToPay as ["2025,1", ...]
  const monthsToPayString: string[] = selectedYearMonths.map(
    (m) => `${m.year},${m.month + 1}`
  );

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || monthsToPayString.length === 0) return;
    await createPayment({
      studentId,
      perMonthAmount: Number(amount),
      monthsToPay: monthsToPayString,
    });
    setShowAddModal(false);
    setAmount("");
    setSelectedYearMonths([]);
    setTempMonths([]);
    refresh();
  };

  return (
    <div className="overflow-x-auto px-2">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-2 overflow-hidden">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          Payment Management
        </h1>
        {/* Add Payment Button */}
        <div className="flex justify-end mb-2">
          <Button color="primary" onClick={() => setShowAddModal(true)}>
            Add Payment
          </Button>
        </div>
        {/* Table */}
        <div className="w-full overflow-x-auto">
          <CustomTable
            columns={columns}
            rows={rows}
            totalRows={paymentData?.pagination?.totalRecords || 0}
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
      {/* Add Payment Modal */}
      <CModal isOpen={showAddModal} onOpenChange={setShowAddModal}>
        <Form onSubmit={handleAddPayment}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Add Payment</ModalHeader>
                <ModalBody>
                  <Input
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  {/* Year/Month Picker */}
                  <div className="mt-4 flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block mb-1 text-sm font-medium">
                        Year
                      </label>
                      <Select
                        options={yearOptions}
                        value={yearOptions.find((y) => y.value === tempYear)}
                        onChange={(val) =>
                          setTempYear(val?.value || new Date().getFullYear())
                        }
                        isSearchable={false}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block mb-1 text-sm font-medium">
                        Months
                      </label>
                      <Select
                        isMulti
                        options={monthOptions}
                        value={tempMonths}
                        onChange={(val) => setTempMonths(val as any)}
                        placeholder="Select months..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                    <Button
                      className="h-10"
                      color="primary"
                      type="button"
                      onClick={handleAddYearMonths}
                      disabled={tempMonths.length === 0}
                    >
                      Add
                    </Button>
                  </div>
                  {/* Display selected year-months as chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedYearMonths.map((pair) => (
                      <span
                        key={`${pair.year}-${pair.month}`}
                        className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {pair.year} - {monthOptions[pair.month].label}
                        <button
                          type="button"
                          className="ml-2 text-blue-600 hover:text-red-600"
                          onClick={() =>
                            handleRemoveYearMonth(pair.year, pair.month)
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    disabled={!amount || selectedYearMonths.length === 0}
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Form>
      </CModal>
    </div>
  );
}

export default UserPaymentDetail;
