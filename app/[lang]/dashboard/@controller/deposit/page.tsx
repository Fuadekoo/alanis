"use client";
import React, { useState, useMemo, ChangeEvent } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { useRegistration } from "@/hooks/useRegistration";
import { DepositSchema } from "@/lib/zodSchema";
import {
  Button,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  CModal,
  Form,
  Skeleton,
} from "@/components/ui/heroui";
import {
  getDeposit,
  depositCreate,
  deleteDeposit,
  depositUpdate,
  getStudent,
  controllerDepositDashboard,
} from "@/actions/controller/deposit";
import z from "zod";
import { useDebouncedCallback } from "use-debounce";
import Select from "react-select";
import chroma from "chroma-js";
import { X } from "lucide-react";
import { useLocalization } from "@/hooks/useLocalization";
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Plus,
} from "lucide-react";

// Define the student option type
interface StudentOption {
  value: string;
  label: string;
  color?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  uuid: string;
  serverFilename?: string;
}

const CHUNK_SIZE = 512 * 1024; // 512KB

function getTimestampUUID(ext: string) {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
}

const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder.png";
  return `/api/filedata/${encodeURIComponent(url)}`;
};

// Define styles for react-select
const selectStyles = {
  control: (styles: any) => ({
    ...styles,
    backgroundColor: "white",
    minHeight: "44px",
    borderRadius: "8px",
  }),
  option: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
    const color = chroma(data.color || "#2684FF");
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? data.color
        : isFocused
        ? color.alpha(0.1).css()
        : undefined,
      color: isDisabled
        ? "#ccc"
        : isSelected
        ? chroma.contrast(color, "white") > 2
          ? "white"
          : "black"
        : data.color,
      cursor: isDisabled ? "not-allowed" : "default",

      ":active": {
        ...styles[":active"],
        backgroundColor: !isDisabled
          ? isSelected
            ? data.color
            : color.alpha(0.3).css()
          : undefined,
      },
    };
  },
  input: (styles: any) => ({ ...styles, height: "40px" }),
  placeholder: (styles: any) => ({ ...styles, color: "#aaa" }),
  singleValue: (styles: any, { data }: any) => ({
    ...styles,
    color: data.color,
  }),
};

// Deposit schema for registration form
const depositSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Minimum amount is 0.01")
    .positive("Amount must be positive"),
  photo: z.string().optional(),
});

function Page() {
  const { t, formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State for upload progress tracking - changed to single file
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);

  const [controllerData, isControllerLoading] = useData(
    controllerDepositDashboard,
    () => {}
  );

  // Data fetching
  const [data, isLoading, refresh] = useData(
    getDeposit,
    () => {},
    "all",
    page,
    pageSize,
    search
  );

  const uploadFile = async (file: File, uuid: string): Promise<string> => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const uuidName = uuid || getTimestampUUID(ext);

    const chunkSize = CHUNK_SIZE;
    const total = Math.ceil(file.size / chunkSize);
    let finalReturnedName: string | null = null;

    for (let i = 0; i < total; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("filename", uuidName);
      formData.append("chunkIndex", i.toString());
      formData.append("totalChunks", total.toString());

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const json = await res.json();
      if (json?.filename) finalReturnedName = json.filename;

      // Update progress for this file
      setUploadProgress((prev) =>
        prev ? { ...prev, progress: Math.round(((i + 1) / total) * 100) } : null
      );
    }

    if (!finalReturnedName) {
      throw new Error("Upload failed: no filename returned");
    }

    return finalReturnedName;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file
    setIsUploading(true);

    // Set upload progress
    const newUpload = {
      file,
      progress: 0,
      uuid: getTimestampUUID(file.name.split(".").pop() || "jpg"),
    };

    setUploadProgress(newUpload);

    try {
      const serverFilename = await uploadFile(file, newUpload.uuid);

      // Update form with the uploaded image filename
      form.setValue("photo", serverFilename, {
        shouldValidate: true,
      });

      // Mark as completed
      setUploadProgress((prev) =>
        prev ? { ...prev, serverFilename, progress: 100 } : null
      );
    } catch (error) {
      console.error("Failed to upload file:", file.name, error);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    form.setValue("photo", "", { shouldValidate: true });
    setUploadProgress(null);
  };

  const removeUploadingFile = () => {
    setUploadProgress(null);
  };

  // Registration (add/edit) logic
  const form = useRegistration(
    async (values: any) => {
      if (editingId) {
        return depositUpdate(editingId, values);
      }
      return depositCreate(values);
    },
    depositSchema,
    (state) => {
      if (state?.status) {
        refresh();
        setEditingId(null);
        form.onOpenChange();
      }
    }
  );

  // Delete logic
  const deletion = useDelete(deleteDeposit, (state) => {
    if (state.status) {
      refresh();
      deletion.close();
    }
  });

  const rows = (data?.data || []).map((deposit) => ({
    key: String(deposit.id),
    id: String(deposit.id),
    studentFullName: deposit.depositedTo
      ? `${deposit.depositedTo.firstName} ${deposit.depositedTo.fatherName} ${deposit.depositedTo.lastName}`
      : "N/A",
    amount: deposit.amount.toString(),
    photo: deposit.photo ?? "",
    status: deposit.status ? String(deposit.status) : "",
    createdAt: deposit.createdAt ?? "",
    studentId: deposit.studentId || "",
  }));

  const columns = [
    {
      key: "studentFullName",
      label: t("deposit.studentName"),
      renderCell: (item: any) => item.studentFullName,
    },
    {
      key: "amount",
      label: t("deposit.amount"),
      renderCell: (item: any) => (
        <span>{formatCurrency(parseFloat(item.amount))}</span>
      ),
    },
    {
      key: "photo",
      label: t("deposit.photo"),
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
          t("deposit.noImage")
        ),
    },
    {
      key: "status",
      label: t("deposit.status"),
      renderCell: (item: any) => (
        <span className="capitalize">{t(`deposit.${item.status}`)}</span>
      ),
    },
    {
      key: "createdAt",
      label: t("deposit.createdAt"),
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
    {
      key: "actions",
      label: t("common.actions"),
      renderCell: (item: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onClick={() => {
              setEditingId(item.id);
              form.edit(item);
            }}
          >
            {t("common.edit")}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onClick={() => deletion.open(item.id)}
          >
            {t("common.delete")}
          </Button>
        </div>
      ),
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
                {t("deposit.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("deposit.subtitle")}
              </p>
            </div>
            <Button
              color="primary"
              onClick={() => {
                setEditingId(null);
                form.add();
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("deposit.addDeposit")}
            </Button>
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
      <Registration
        form={form}
        isEditing={!!editingId}
        uploadProgress={uploadProgress}
        handleImageChange={handleImageChange}
        removeUploadingFile={removeUploadingFile}
        removeImage={removeImage}
        isUploading={isUploading}
      />
      <Deletion deletion={deletion} />
    </div>
  );
}

function Registration({
  form,
  isEditing,
  uploadProgress,
  handleImageChange,
  removeUploadingFile,
  removeImage,
  isUploading,
}: {
  form: ReturnType<typeof useRegistration>;
  isEditing: boolean;
  uploadProgress: UploadProgress | null;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  removeUploadingFile: () => void;
  removeImage: () => void;
  isUploading: boolean;
}) {
  const { t } = useLocalization();
  const [search, setSearch] = useState("");
  const filter = useDebouncedCallback((value: string) => setSearch(value), 300);
  const [students, isLoading] = useData(getStudent, () => {}, search);

  // Transform students data to options for react-select
  const studentOptions = useMemo(() => {
    if (!students) return [];

    return students.map((student: any) => ({
      value: student.id,
      label: `${student.firstName} ${student.fatherName} ${student.lastName}`,
      color: "#2684FF",
    }));
  }, [students]);

  // Get the currently selected student
  const selectedStudent = useMemo(() => {
    const studentId = form.watch("studentId");
    return studentOptions.find((option) => option.value === studentId) || null;
  }, [form.watch("studentId"), studentOptions]);

  // Get the current photo from the form state
  const currentPhoto = form.watch("photo") || "";

  return (
    <CModal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
      <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
        <ModalContent>
          {!students ? (
            <Skeleton />
          ) : (
            (onClose: () => void) => (
              <>
                <ModalHeader>
                  {isEditing
                    ? t("deposit.editDeposit")
                    : t("deposit.addDeposit")}
                </ModalHeader>
                <ModalBody>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      {t("deposit.studentName")}
                    </label>
                    <Select
                      options={studentOptions}
                      value={selectedStudent}
                      onChange={(selectedOption: StudentOption | null) => {
                        if (selectedOption) {
                          form.setValue("studentId", selectedOption.value);
                        } else {
                          form.setValue("studentId", "");
                        }
                      }}
                      styles={selectStyles}
                      isClearable
                      placeholder={t("deposit.selectStudent")}
                      isLoading={isLoading}
                      onInputChange={filter}
                    />
                    {form.validationErrors.studentId && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.validationErrors.studentId}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <Input
                      label={t("deposit.amount")}
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...form.register("amount")}
                      required
                    />
                    {form.validationErrors.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {form.validationErrors.amount}
                      </p>
                    )}
                  </div>

                  {/* Single Image Upload Section */}
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">
                      {t("deposit.photoUpload")}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      disabled={isUploading}
                    />

                    {/* Upload Progress */}
                    {uploadProgress && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{uploadProgress.file.name}</span>
                              <span>{uploadProgress.progress}%</span>
                            </div>
                            <progress
                              value={uploadProgress.progress}
                              max={100}
                              className="w-full h-2"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={removeUploadingFile}
                            disabled={uploadProgress.progress === 100}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Current Photo Preview */}
                    {currentPhoto && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">
                          {t("deposit.currentPhoto")}:
                        </p>
                        <div className="relative inline-block">
                          <img
                            src={formatImageUrl(currentPhoto)}
                            alt="Deposit proof"
                            className="w-32 h-32 object-cover rounded border"
                          />
                          <Button
                            size="sm"
                            color="danger"
                            className="absolute top-1 right-1"
                            onPress={removeImage}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show photo validation errors */}
                    {form.validationErrors.photo && (
                      <span className="text-red-500 text-xs">
                        {form.validationErrors.photo}
                      </span>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={form.isLoading || isUploading}
                  >
                    {t("common.save")}
                  </Button>
                </ModalFooter>
              </>
            )
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}

function Deletion({ deletion }: { deletion: UseDelete }) {
  const { t } = useLocalization();

  return (
    <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{t("deposit.deleteDeposit")}</ModalHeader>
            <ModalBody>
              <p className="p-5 text-center ">{t("messages.confirmDelete")}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                color="danger"
                onPress={deletion.handle}
                isLoading={deletion.isLoading}
              >
                {t("common.delete")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}

export default Page;
