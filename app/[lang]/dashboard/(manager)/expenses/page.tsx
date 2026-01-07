"use client";
import React, { useState, useEffect } from "react";
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
  Input,
  Textarea,
} from "@heroui/react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getExpenseAnalytics,
} from "@/actions/manager/expense";
import { addToast } from "@heroui/toast";
import { useLocalization } from "@/hooks/useLocalization";
import { useRegistration } from "@/hooks/useRegistration";
import { expenseSchema } from "@/lib/zodSchema";
import {
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";
import { Eye } from "lucide-react";
import Image from "next/image";
import { DatePicker } from "@/components/ui/heroui";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import { X } from "lucide-react";

function Page() {
  const { formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [processingDeleteId, setProcessingDeleteId] = useState<string | null>(
    null
  );

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState<File | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Photo preview modal state
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>("");

  const openPhotoPreview = (filename: string) => {
    if (!filename) return;
    setPreviewPhotoUrl(filename);
    setIsPhotoPreviewOpen(true);
  };
  const closePhotoPreview = () => {
    setIsPhotoPreviewOpen(false);
    setPreviewPhotoUrl("");
  };

  // Analytics data
  const [analyticsData, isLoadingAnalytics] = useData(
    getExpenseAnalytics,
    () => {}
  );

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getExpenses,
    () => {},
    search,
    page,
    pageSize,
    startDate,
    endDate
  );

  // Registration form
  const form = useRegistration(
    async (data, editingIdParam) => {
      // Extract id from data if present, otherwise use parameter
      const idToUse = data.id || editingIdParam;
      // Remove id from data before sending
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...expenseData } = data;
      return await createExpense(expenseData, idToUse);
    },
    expenseSchema,
    (state) => {
      if (state.status) {
        refresh();
        setEditingId(undefined);
      }
    }
  );

  // Delete mutation
  const [deleteAction, isLoadingDelete] = useMutation(
    deleteExpense,
    (state) => {
      setProcessingDeleteId(null);
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      refresh();
      addToast({
        title: "Delete Expense",
        description: state?.message || "Expense deleted successfully.",
      });
    }
  );

  // Handle edit
  const handleEdit = (expense: {
    id: string;
    name: string;
    amount: number;
    date: string;
    description?: string;
    paymentPhoto?: string | null;
  }) => {
    setEditingId(expense.id);
    form.edit({
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      date: new Date(expense.date),
      description: expense.description || "",
      paymentPhoto: expense.paymentPhoto || "",
    });
  };

  // Handle delete click
  const handleDeleteClick = (id: string, name: string) => {
    setExpenseToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      setProcessingDeleteId(expenseToDelete.id);
      deleteAction(expenseToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setExpenseToDelete(null);
  };

  // Handle date change
  const handleDateChange = (dates: {
    startDate: string | null;
    endDate: string | null;
  }) => {
    setStartDate(dates.startDate ? new Date(dates.startDate) : undefined);
    setEndDate(dates.endDate ? new Date(dates.endDate) : undefined);
    setPage(1);
  };

  // Reset editing when modal closes
  useEffect(() => {
    if (!form.isOpen && editingId) {
      setEditingId(undefined);
    }
  }, [form.isOpen, editingId]);

  const rows = (data?.data || []).map(
    (expense: {
      id: string;
      name: string;
      amount: number;
      date: string;
      description?: string | null;
      createdAt: string;
      paymentPhoto?: string | null;
    }) => ({
      key: String(expense.id),
      id: String(expense.id),
      name: expense.name || "",
      amount: expense.amount != null ? String(expense.amount) : "",
      date: expense.date || "",
      description: expense.description || "",
      createdAt: expense.createdAt || "",
      paymentPhoto: expense.paymentPhoto || "",
    })
  );

  const columns = [
    {
      key: "name",
      label: "Expense Name",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="font-semibold text-red-600 dark:text-red-400">
          {formatCurrency(Number(item.amount))}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => {
        const date = new Date(item.date);
        return (
          <span className="text-sm">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      key: "paymentPhoto",
      label: "Payment Photo",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.paymentPhoto ? (
          <Image
            src={`/api/filedata/${encodeURIComponent(
              item.paymentPhoto as string
            )}`}
            alt="Payment"
            width={40}
            height={40}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <span className="text-default-400 text-xs">No image</span>
        ),
    },
    {
      key: "description",
      label: "Description",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          {item.paymentPhoto ? (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="default"
              onPress={() => openPhotoPreview(item.paymentPhoto)}
              aria-label="View payment photo"
            >
              <Eye className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => handleEdit(item)}
            aria-label="Edit expense"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            color="danger"
            onPress={() => handleDeleteClick(item.id, item.name)}
            aria-label="Delete expense"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto px-2 py-6">
      <div className="w-full mx-auto grid grid-rows-[auto_auto_1fr] gap-6 overflow-hidden">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {/* Total Expenses Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 dark:text-red-200 text-sm font-medium">
                  Total Expenses
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.totalExpenseAmount || 0)
                      )}
                </p>
                <p className="text-red-100 dark:text-red-200 text-xs mt-1">
                  {analyticsData?.totalExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Expenses Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  This Month
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.thisMonthExpenseAmount || 0)
                      )}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {analyticsData?.thisMonthExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Year Expenses Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  This Year
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.thisYearExpenseAmount || 0)
                      )}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {analyticsData?.thisYearExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Week Expenses Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  This Week
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingAnalytics
                    ? "..."
                    : formatCurrency(
                        Number(analyticsData?.thisWeekExpenseAmount || 0)
                      )}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {analyticsData?.thisWeekExpenseCount || 0} expenses
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Expense Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Register and manage your expenses
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => {
                setEditingId(undefined);
                form.add();
              }}
              className="w-full sm:w-auto"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-h-0">
          <CustomTable
            columns={columns}
            rows={rows.map((row: Record<string, string | number>) =>
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
            startDate={startDate?.toISOString().split("T")[0] || null}
            endDate={endDate?.toISOString().split("T")[0] || null}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

      {/* Registration/Edit Modal */}
      <Modal
        isOpen={form.isOpen}
        onOpenChange={form.onOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <form onSubmit={form.onSubmit}>
              <ModalHeader>
                {editingId ? "Edit Expense" : "Register New Expense"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Expense Name"
                  labelPlacement="outside"
                  placeholder="Enter expense name"
                  {...form.register("name")}
                  isRequired
                  errorMessage={form.validationErrors.name}
                  isInvalid={!!form.validationErrors.name}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    label="Amount"
                    labelPlacement="outside"
                    placeholder="Enter amount"
                    type="number"
                    {...form.register("amount")}
                    isRequired
                    errorMessage={form.validationErrors.amount}
                    isInvalid={!!form.validationErrors.amount}
                    startContent={<span className="text-gray-500">ETB</span>}
                  />
                  <div className="flex items-end gap-2">
                    <DatePicker
                      className="flex-1"
                      label="Date"
                      labelPlacement="outside"
                      value={
                        form.watch("date")
                          ? (() => {
                              const date = form.watch("date");
                              if (!date) return null;
                              const year = date.getFullYear();
                              const month = String(
                                date.getMonth() + 1
                              ).padStart(2, "0");
                              const day = String(date.getDate()).padStart(
                                2,
                                "0"
                              );
                              return parseDate(`${year}-${month}-${day}`);
                            })()
                          : null
                      }
                      onChange={(v) => {
                        if (v) {
                          const d = v.toDate(getLocalTimeZone());
                          const localDate = new Date(
                            d.getFullYear(),
                            d.getMonth(),
                            d.getDate()
                          );
                          form.setValue("date", localDate);
                        }
                      }}
                      isRequired
                    />
                    {form.watch("date") && (
                      <Button
                        isIconOnly
                        variant="flat"
                        color="danger"
                        onPress={() => form.setValue("date", new Date())}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {form.validationErrors.date && (
                  <p className="text-sm text-danger">
                    {form.validationErrors.date}
                  </p>
                )}
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Enter description (optional)"
                  {...form.register("description")}
                  errorMessage={form.validationErrors.description}
                  isInvalid={!!form.validationErrors.description}
                  minRows={3}
                />

                {/* Payment Photo Upload */}
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-2">
                    Payment Photo (optional)
                  </label>
                  {form.watch("paymentPhoto") ? (
                    <div className="flex items-center gap-3">
                      <img
                        className="h-16 w-16 rounded object-cover border"
                        src={`/api/filedata/${encodeURIComponent(
                          form.watch("paymentPhoto") || ""
                        )}`}
                        alt="payment"
                      />
                      <Button
                        variant="flat"
                        color="danger"
                        onPress={() => {
                          form.setValue("paymentPhoto", "");
                          setUploadedPhotoUrl("");
                          setUploadingPhoto(null);
                          setUploadProgress(0);
                        }}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingPhoto(file);
                          setIsUploading(true);
                          setUploadProgress(0);

                          try {
                            const CHUNK_SIZE = 512 * 1024; // 512KB
                            const ext = (
                              file.name.split(".").pop() || "jpg"
                            ).toLowerCase();
                            const uuid = `${Date.now()}-${Math.floor(
                              Math.random() * 100000
                            )}.${ext}`;
                            const total = Math.ceil(file.size / CHUNK_SIZE);
                            let serverFilename: string | null = null;

                            for (let i = 0; i < total; i++) {
                              const start = i * CHUNK_SIZE;
                              const end = Math.min(
                                file.size,
                                start + CHUNK_SIZE
                              );
                              const chunk = file.slice(start, end);

                              const formData = new FormData();
                              formData.append("chunk", chunk);
                              formData.append("filename", uuid);
                              formData.append("chunkIndex", i.toString());
                              formData.append("totalChunks", total.toString());

                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              if (!res.ok) throw new Error("Upload failed");
                              const json = await res.json();
                              serverFilename = json.filename || serverFilename;
                              setUploadProgress(
                                Math.round(((i + 1) / total) * 100)
                              );
                            }

                            if (!serverFilename)
                              throw new Error("No filename returned");
                            setUploadedPhotoUrl(serverFilename);
                            form.setValue("paymentPhoto", serverFilename);
                          } catch (err) {
                            console.error(err);
                            addToast({
                              title: "Upload failed",
                              description: "Could not upload photo.",
                            });
                            setUploadingPhoto(null);
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                      {isUploading && (
                        <div className="text-sm text-gray-500">
                          Uploading... {uploadProgress}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={form.isLoading}
                  startContent={!form.isLoading && <Plus className="h-4 w-4" />}
                >
                  {editingId ? "Update Expense" : "Register Expense"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        size="md"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Delete Expense</ModalHeader>
              <ModalBody>
                <p className="text-center p-5">
                  Are you sure you want to delete the expense{" "}
                  <span className="font-semibold text-danger">
                    &quot;{expenseToDelete?.name}&quot;
                  </span>
                  ? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={handleCancelDelete}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmDelete}
                  isLoading={
                    isLoadingDelete &&
                    processingDeleteId === expenseToDelete?.id
                  }
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Payment Photo Preview Modal */}
      <Modal
        isOpen={isPhotoPreviewOpen}
        onOpenChange={setIsPhotoPreviewOpen}
        size="md"
        backdrop="blur"
        classNames={{ backdrop: "bg-black/50 backdrop-blur-md" }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-default-200/80 dark:bg-default-700/60">
              <Eye className="size-6" />
            </div>
            <h3 className="text-xl font-bold">Payment Photo</h3>
          </ModalHeader>
          <ModalBody>
            {previewPhotoUrl ? (
              <div className="flex justify-center">
                <Image
                  src={`/api/filedata/${encodeURIComponent(previewPhotoUrl)}`}
                  alt="Payment photo preview"
                  width={320}
                  height={320}
                  className="max-h-[360px] w-auto object-contain rounded-lg border"
                />
              </div>
            ) : (
              <p className="text-center text-sm text-default-500">
                No photo available
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closePhotoPreview}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Page;
