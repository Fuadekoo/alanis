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
      label: "Student Name",
      renderCell: (item: any) => item.studentFullName,
    },
    {
      key: "amount",
      label: "Amount",
      renderCell: (item: any) => (
        <span>
          {parseFloat(item.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          ETB
        </span>
      ),
    },
    {
      key: "photo",
      label: "Photo",
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
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onClick={() => {
              setEditingId(item.id);
              form.edit(item);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onClick={() => deletion.open(item.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-x-auto px-2">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-2 overflow-hidden">
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
        <div className="p-1 bg-default-50/30 rounded-xl flex gap-2">
          <div className="flex-1"></div>
          <Button
            color="primary"
            onClick={() => {
              setEditingId(null);
              form.add();
            }}
          >
            Add Deposit
          </Button>
        </div>
        {/* Make table horizontally scrollable on mobile */}
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
            (onClose) => (
              <>
                <ModalHeader>
                  {isEditing ? "Edit Deposit" : "Add Deposit"}
                </ModalHeader>
                <ModalBody>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Student
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
                      placeholder="Select a student..."
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
                      label="Amount"
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
                      Deposit Proof Photo
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
                          Current Photo:
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
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={form.isLoading || isUploading}
                  >
                    Submit
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
  return (
    <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Delete Deposit</ModalHeader>
            <ModalBody>
              <p className="p-5 text-center ">
                Are you sure you want to{" "}
                <span className="text-danger">delete</span> this deposit?
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
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}

export default Page;
