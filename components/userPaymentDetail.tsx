"use client";
import React, { useState } from "react";
import {
  createPayment,
  getPayment,
  rollbackPayment,
  getBalance,
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
    pageSize,
    search
  );
  const [balance, balanceLoading, balanceRefresh] = useData(
    getBalance,
    () => {},
    studentId
  );
  useRegistration(createPayment, paymentSchema, (state) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (paymentData?.data || []).map((p: any) => ({
    key: String(p.id),
    id: String(p.id),
    year: p.year,
    month: p.month,
    amount: p.perMonthAmount,
    createdAt: p.createdAt ?? "",
  }));

  const columns = [
    {
      key: "year",
      label: "Year",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.year,
    },
    {
      key: "month",
      label: "Month",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.month,
    },
    {
      key: "amount",
      label: "Amount",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span>
          {item.amount ? `${Number(item.amount).toLocaleString()} ETB` : ""}
        </span>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onClick={() => deletion.open(item.id)}
          >
            Rollback
          </Button>
        </div>
      ),
    },
  ];

  // Add Payment Modal state
  const [amount, setAmount] = useState("");
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
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
    label: `${i + 1} - ${new Date(2000, i, 1).toLocaleString("default", {
      month: "long",
    })}`,
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

  // Check balance when amount or selected months change
  const checkBalance = React.useCallback(async () => {
    if (!amount || selectedYearMonths.length === 0) {
      setBalanceWarning(null);
      return;
    }

    const totalRequired = Number(amount) * selectedYearMonths.length;
    const currentBalance = await getBalance(studentId);

    if (currentBalance !== null && currentBalance < totalRequired) {
      setBalanceWarning(
        `Insufficient balance! Required: ${totalRequired.toLocaleString()} ETB, Available: ${currentBalance.toLocaleString()} ETB`
      );
    } else {
      setBalanceWarning(null);
    }
  }, [amount, selectedYearMonths, studentId]);

  // Check balance whenever amount or selected months change
  React.useEffect(() => {
    checkBalance();
  }, [amount, selectedYearMonths, checkBalance]);

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

    const result = await createPayment({
      studentId,
      perMonthAmount: Number(amount),
      monthsToPay: monthsToPayString,
    });

    if (result.status) {
      setShowAddModal(false);
      setAmount("");
      setSelectedYearMonths([]);
      setTempMonths([]);
      refresh();
    } else {
      // Show error message to user
      alert(result.message || "Failed to create payment");
    }
  };

  return (
    <div className="overflow-x-auto px-2">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-2 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          {/* Balance and Refresh */}
          <div className="flex items-center gap-2">
            {balanceLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <span className="text-lg font-semibold text-green-700">
                Balance: {balance} ETB
              </span>
            )}
            <Button
              size="sm"
              variant="flat"
              onClick={balanceRefresh}
              disabled={balanceLoading}
            >
              Refresh
            </Button>
          </div>
          {/* Add Payment Button */}
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
                  {/* Balance Warning */}
                  {balanceWarning && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            !
                          </span>
                        </div>
                        <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                          {balanceWarning}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Year/Month Picker */}
                  <div className="mt-4 space-y-4">
                    {/* Responsive grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div className="sm:col-span-1">
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              backgroundColor: "var(--select-bg)",
                              borderColor: state.isFocused
                                ? "#3b82f6"
                                : "var(--select-border)",
                              boxShadow: state.isFocused
                                ? "0 0 0 1px #3b82f6"
                                : "none",
                              "&:hover": {
                                borderColor: "#3b82f6",
                              },
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: "var(--select-menu-bg)",
                              border: "1px solid var(--select-border)",
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected
                                ? "#3b82f6"
                                : state.isFocused
                                ? "var(--select-option-hover)"
                                : "transparent",
                              color: state.isSelected
                                ? "white"
                                : "var(--select-text)",
                              "&:hover": {
                                backgroundColor: state.isSelected
                                  ? "#3b82f6"
                                  : "var(--select-option-hover)",
                              },
                            }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: "var(--select-multi-value-bg)",
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: "var(--select-multi-value-text)",
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: "var(--select-multi-value-text)",
                              "&:hover": {
                                backgroundColor: "#ef4444",
                                color: "white",
                              },
                            }),
                          }}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Months
                        </label>
                        <Select
                          isMulti
                          options={monthOptions}
                          value={tempMonths}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onChange={(val) => setTempMonths(val as any)}
                          placeholder="Select months..."
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              backgroundColor: "var(--select-bg)",
                              borderColor: state.isFocused
                                ? "#3b82f6"
                                : "var(--select-border)",
                              boxShadow: state.isFocused
                                ? "0 0 0 1px #3b82f6"
                                : "none",
                              "&:hover": {
                                borderColor: "#3b82f6",
                              },
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: "var(--select-menu-bg)",
                              border: "1px solid var(--select-border)",
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected
                                ? "#3b82f6"
                                : state.isFocused
                                ? "var(--select-option-hover)"
                                : "transparent",
                              color: state.isSelected
                                ? "white"
                                : "var(--select-text)",
                              "&:hover": {
                                backgroundColor: state.isSelected
                                  ? "#3b82f6"
                                  : "var(--select-option-hover)",
                              },
                            }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: "var(--select-multi-value-bg)",
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: "var(--select-multi-value-text)",
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: "var(--select-multi-value-text)",
                              "&:hover": {
                                backgroundColor: "#ef4444",
                                color: "white",
                              },
                            }),
                          }}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Button
                          className="w-full h-10"
                          color="primary"
                          type="button"
                          onClick={handleAddYearMonths}
                          disabled={tempMonths.length === 0}
                        >
                          Add Selection
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Display selected year-months as chips */}
                  {selectedYearMonths.length > 0 && (
                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected Year-Months:
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {selectedYearMonths.map((pair) => (
                          <span
                            key={`${pair.year}-${pair.month}`}
                            className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <span className="text-xs">
                              {pair.year} - {monthOptions[pair.month].label}
                            </span>
                            <button
                              type="button"
                              className="ml-1 text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                              onClick={() =>
                                handleRemoveYearMonth(pair.year, pair.month)
                              }
                              aria-label={`Remove ${pair.year} - ${
                                monthOptions[pair.month].label
                              }`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    disabled={
                      !amount ||
                      selectedYearMonths.length === 0 ||
                      balanceWarning !== null
                    }
                  >
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Form>
      </CModal>
      {/* Deletion Modal */}
      <DeletionModal deletion={deletion} />
    </div>
  );
}

function DeletionModal({
  deletion,
}: {
  deletion: ReturnType<typeof useDelete>;
}) {
  return (
    <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Rollback Payment</ModalHeader>
            <ModalBody>
              <p className="p-5 text-center">
                Are you sure you want to{" "}
                <span className="text-danger">rollback</span> this payment?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={deletion.handle}
                isLoading={deletion.isLoading}
              >
                Rollback
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}

export default UserPaymentDetail;
