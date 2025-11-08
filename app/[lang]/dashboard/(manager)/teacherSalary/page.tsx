"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Skeleton,
} from "@/components/ui/heroui";
import {
  Plus,
  Calculator,
  Check,
  X,
  AlertTriangle,
  Upload,
  Eye,
} from "lucide-react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import useAmharic from "@/hooks/useAmharic";
import {
  getSalary,
  createSalary,
  getTeacherProgressForSalary,
  getShiftTeacherDataForSalary,
  updateSalary,
} from "@/actions/manager/salary";
import { getTeacherList } from "@/actions/controller/teacher";
import { paymentStatus } from "@prisma/client";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

interface TeacherSalaryData {
  id?: string;
  teacher: {
    firstName: string;
    fatherName: string;
    lastName: string;
  };
  month: number;
  year: number;
  totalDayForLearning: number;
  unitPrice?: number;
  amount?: number;
  status?: string;
  [key: string]: unknown;
}

function Page() {
  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [selectedSalaryId, setSelectedSalaryId] = useState<string>("");
  const [selectedSalaryData, setSelectedSalaryData] =
    useState<TeacherSalaryData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [selectedTeacherProgress, setSelectedTeacherProgress] = useState<
    Set<string>
  >(new Set());
  const [selectedShiftTeacherData, setSelectedShiftTeacherData] = useState<
    Set<string>
  >(new Set());

  // Photo upload state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>("");
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>("");

  // Fetch data
  const [salaries, salariesLoading, refreshSalaries] = useData(
    getSalary,
    () => {}
  );
  const [teachers, teachersLoading] = useData(getTeacherList, () => {});
  const [teacherProgress, teacherProgressLoading] = useData(
    getTeacherProgressForSalary,
    () => {},
    selectedTeacher || ""
  );
  const [shiftTeacherData, shiftTeacherDataLoading] = useData(
    getShiftTeacherDataForSalary,
    () => {},
    selectedTeacher || ""
  );

  // Create salary mutation
  const [createSalaryMutation, isCreating] = useMutation(createSalary, () => {
    refreshSalaries();
    setIsModalOpen(false);
    resetForm();
  });

  // Reset form
  const resetForm = () => {
    setSelectedTeacher("");
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setUnitPrice(0);
    setSelectedTeacherProgress(new Set());
    setSelectedShiftTeacherData(new Set());
  };

  // Photo upload helpers
  const CHUNK_SIZE = 512 * 1024; // 512KB

  const getTimestampUUID = (ext: string) => {
    return `${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
  };

  const formatImageUrl = (url: string | null | undefined): string => {
    if (!url) return "/placeholder.png";
    return `/api/filedata/${encodeURIComponent(url)}`;
  };

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

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed for chunk ${i + 1} of ${total}`);
      }

      const result = await response.json();
      finalReturnedName = result.filename;

      // Update progress
      const progress = Math.round(((i + 1) / total) * 100);
      setUploadProgress(progress);
    }

    if (!finalReturnedName) {
      throw new Error("Upload completed but no filename received");
    }

    return finalReturnedName;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const uuid = getTimestampUUID(ext);
      const serverFilename = await uploadFile(file, uuid);
      setUploadedPhotoUrl(serverFilename);
      setUploadProgress(100);
    } catch (error) {
      console.error("Failed to upload photo:", error);
      showAlert({
        message: isAm ? "ፎቶ መስቀል አልተሳካም" : "Failed to upload photo",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      setUploadingPhoto(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = () => {
    setUploadedPhotoUrl("");
    setUploadingPhoto(null);
    setUploadProgress(0);
  };

  const openPhotoPreview = (photo: string) => {
    if (!photo) return;
    setPreviewPhotoUrl(photo);
    setIsPhotoPreviewOpen(true);
  };

  const closePhotoPreview = () => {
    setIsPhotoPreviewOpen(false);
    setPreviewPhotoUrl("");
  };

  // Calculate totalDayForLearning and amount
  const calculations = useMemo(() => {
    let totalDayForLearning = 0;

    // Sum from selected TeacherProgress
    if (teacherProgress && selectedTeacherProgress.size > 0) {
      const selectedProgress = teacherProgress.filter((tp) =>
        selectedTeacherProgress.has(tp.id)
      );
      totalDayForLearning += selectedProgress.reduce(
        (sum, tp) => sum + (tp.learningCount || 0),
        0
      );
    }

    // Sum from selected ShiftTeacherData
    if (shiftTeacherData && selectedShiftTeacherData.size > 0) {
      const selectedShift = shiftTeacherData.filter((std) =>
        selectedShiftTeacherData.has(std.id)
      );
      totalDayForLearning += selectedShift.reduce(
        (sum, std) => sum + (std.learningCount || 0),
        0
      );
    }

    const amount = totalDayForLearning * unitPrice;

    return { totalDayForLearning, amount };
  }, [
    teacherProgress,
    shiftTeacherData,
    selectedTeacherProgress,
    selectedShiftTeacherData,
    unitPrice,
  ]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedTeacher) {
      showAlert({
        message: isAm ? "እባክዎ መምህር ይምረጡ" : "Please select a teacher",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    if (
      selectedTeacherProgress.size === 0 &&
      selectedShiftTeacherData.size === 0
    ) {
      showAlert({
        message: isAm
          ? "እባክዎ ቢያንስ አንድ TeacherProgress ወይም ShiftTeacherData ይምረጡ"
          : "Please select at least one TeacherProgress or ShiftTeacherData",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    if (unitPrice <= 0) {
      showAlert({
        message: isAm ? "እባክዎ የምክንያት ዋጋ ያስገቡ" : "Please enter unit price",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    if (month < 1 || month > 12) {
      showAlert({
        message: isAm
          ? "እባክዎ ልክ ያለ ወር ያስገቡ (1-12)"
          : "Please enter valid month (1-12)",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    if (year < 2000) {
      showAlert({
        message: isAm ? "እባክዎ ልክ ያለ ዓመት ያስገቡ" : "Please enter valid year",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    await createSalaryMutation(
      selectedTeacher,
      month,
      year,
      unitPrice,
      Array.from(selectedTeacherProgress),
      Array.from(selectedShiftTeacherData)
    );
  };

  // Open confirmation modal
  const openConfirmModal = (
    salaryId: string,
    salary: TeacherSalaryData,
    action: "approve" | "reject"
  ) => {
    setSelectedSalaryId(salaryId);
    setSelectedSalaryData(salary);

    if (action === "approve") {
      removePhoto();
      setConfirmAction(null);
      setIsPhotoModalOpen(true);
      return;
    }

    setConfirmAction(action);
    setIsConfirmModalOpen(true);
  };

  // Handle approve/reject salary
  const handleConfirmAction = async () => {
    if (!selectedSalaryId || !confirmAction) return;

    // If approving, open photo upload modal
    if (confirmAction === "approve") {
      setIsConfirmModalOpen(false);
      setIsPhotoModalOpen(true);
      return;
    }

    // For reject, proceed directly
    setIsUpdating(true);
    try {
      const result = await updateSalary(
        selectedSalaryId,
        paymentStatus.rejected
      );

      if (result) {
        setIsConfirmModalOpen(false);
        setSelectedSalaryId("");
        setSelectedSalaryData(null);
        setConfirmAction(null);
        if (refreshSalaries) {
          refreshSalaries();
        }
        showAlert({
          message: isAm
            ? "ደሞዝ በተሳካ ሁኔታ ተቀባይነት አላገኘም!"
            : "Salary rejected successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
      } else {
        showAlert({
          message: isAm ? "ደሞዝ ማዘመን አልተሳካም" : "Failed to update salary",
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch {
      showAlert({
        message: isAm ? "ደሞዝ ማዘመን አልተሳካም" : "Failed to update salary",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveWithPhoto = async () => {
    if (!selectedSalaryId) return;

    if (!uploadedPhotoUrl) {
      showAlert({
        message: isAm ? "እባክዎ የክፍያ ፎቶ ይስቀሉ" : "Please upload payment photo",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateSalary(
        selectedSalaryId,
        paymentStatus.approved,
        uploadedPhotoUrl
      );

      if (result) {
        setIsPhotoModalOpen(false);
        setSelectedSalaryId("");
        setSelectedSalaryData(null);
        setConfirmAction(null);
        removePhoto();
        if (refreshSalaries) {
          refreshSalaries();
        }
        showAlert({
          message: isAm
            ? "ደሞዝ በተሳካ ሁኔታ ጸድቋል!"
            : "Salary approved successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
      } else {
        showAlert({
          message: isAm ? "ደሞዝ ማዘመን አልተሳካም" : "Failed to update salary",
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch {
      showAlert({
        message: isAm ? "ደሞዝ ማዘመን አልተሳካም" : "Failed to update salary",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Prepare table data
  const filteredSalaries = useMemo(() => {
    if (!salaries) return [];
    let filtered = salaries;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (salary) =>
          `${salary.teacher.firstName} ${salary.teacher.fatherName} ${salary.teacher.lastName}`
            .toLowerCase()
            .includes(searchLower) ||
          salary.year.toString().includes(searchLower) ||
          salary.month.toString().includes(searchLower)
      );
    }

    return filtered;
  }, [salaries, search]);

  const paginatedSalaries = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredSalaries.slice(start, end).map((salary) => ({
      ...salary,
      key: salary.id,
    }));
  }, [filteredSalaries, page, pageSize]);

  // Table columns
  const columns = [
    {
      key: "teacher",
      label: isAm ? "መምህር" : "Teacher",
      renderCell: (item: Record<string, unknown>) => {
        const teacher = item.teacher as Record<string, unknown>;
        return (
          <span>
            {teacher.firstName as string} {teacher.fatherName as string}{" "}
            {teacher.lastName as string}
          </span>
        );
      },
    },
    {
      key: "month",
      label: isAm ? "ወር" : "Month",
      renderCell: (item: Record<string, unknown>) => (
        <span>{item.month as number}</span>
      ),
    },
    {
      key: "year",
      label: isAm ? "ዓመት" : "Year",
      renderCell: (item: Record<string, unknown>) => (
        <span>{item.year as number}</span>
      ),
    },
    {
      key: "totalDayForLearning",
      label: isAm ? "የመማሪያ ቀናት" : "Learning Days",
      renderCell: (item: Record<string, unknown>) => (
        <span>{item.totalDayForLearning as number}</span>
      ),
    },
    {
      key: "unitPrice",
      label: isAm ? "የአሃድ ዋጋ" : "Unit Price",
      renderCell: (item: Record<string, unknown>) => (
        <span>{(item.unitPrice as number).toLocaleString()}</span>
      ),
    },
    {
      key: "amount",
      label: isAm ? "ጠቅላላ" : "Total Amount",
      renderCell: (item: Record<string, unknown>) => (
        <span className="font-semibold">
          {(item.amount as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: isAm ? "ሁኔታ" : "Status",
      renderCell: (item: Record<string, unknown>) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            item.status === paymentStatus.approved
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : item.status === paymentStatus.rejected
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
        >
          {item.status as string}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: isAm ? "የተፈጠረበት ቀን" : "Created At",
      renderCell: (item: Record<string, unknown>) => (
        <span>{new Date(item.createdAt as string).toLocaleDateString()}</span>
      ),
    },
    {
      key: "paymentPhoto",
      label: isAm ? "የክፍያ ፎቶ" : "Payment Photo",
      renderCell: (item: Record<string, unknown>) =>
        item.paymentPhoto ? (
          <Image
            src={formatImageUrl(item.paymentPhoto as string)}
            alt="Payment"
            width={40}
            height={40}
            style={{
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <span className="text-default-400 text-xs">
            {isAm ? "ምስል የለም" : "No image"}
          </span>
        ),
    },
    {
      key: "actions",
      label: isAm ? "ድርጊቶች" : "Actions",
      renderCell: (item: Record<string, unknown>) => {
        const paymentPhoto =
          typeof item.paymentPhoto === "string" && item.paymentPhoto
            ? (item.paymentPhoto as string)
            : undefined;

        return (
          <div className="flex gap-2">
            {paymentPhoto && (
              <Button
                size="sm"
                variant="flat"
                color="default"
                isIconOnly
                aria-label={isAm ? "የክፍያ ፎቶ ይመልከቱ" : "View payment photo"}
                onPress={() => openPhotoPreview(paymentPhoto)}
              >
                <Eye className="size-3" />
              </Button>
            )}
            {item.status === paymentStatus.pending && (
              <>
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<Check className="size-3" />}
                  onPress={() =>
                    openConfirmModal(
                      item.id as string,
                      item as TeacherSalaryData,
                      "approve"
                    )
                  }
                >
                  {isAm ? "ጸድቅ" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<X className="size-3" />}
                  onPress={() =>
                    openConfirmModal(
                      item.id as string,
                      item as TeacherSalaryData,
                      "reject"
                    )
                  }
                >
                  {isAm ? "አትቀበል" : "Reject"}
                </Button>
              </>
            )}
            {item.status === paymentStatus.approved && (
              <span className="text-xs text-success font-medium">
                {isAm ? "ጸድቋል" : "Approved"}
              </span>
            )}
            {item.status === paymentStatus.rejected && (
              <span className="text-xs text-danger font-medium">
                {isAm ? "ተቀባይነት አላገኘም" : "Rejected"}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="h-full overflow-hidden p-3 sm:p-5">
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isAm ? "መምህር ደሞዝ" : "Teacher Salary"}
            </h1>
            <p className="text-sm text-default-500 mt-1">
              {isAm
                ? "መምህሮችን ደሞዝ ይፈጥሩ እና ያስተዳድሩ"
                : "Create and manage teacher salaries"}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="size-4" />}
            onPress={() => setIsModalOpen(true)}
            className="shrink-0"
          >
            {isAm ? "አዲስ ደሞዝ ይፍጠሩ" : "Create Salary"}
          </Button>
        </div>

        {/* Salary Table Card */}
        <Card className="flex-1 overflow-hidden">
          <CardBody className="p-0 h-full overflow-auto">
            <CustomTable
              rows={paginatedSalaries}
              columns={columns}
              totalRows={filteredSalaries.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              searchValue={search}
              onSearch={setSearch}
              isLoading={salariesLoading}
            />
          </CardBody>
        </Card>
      </div>

      {/* Create Salary Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {isAm ? "አዲስ ደሞዝ ይፍጠሩ" : "Create New Salary"}
            </h2>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {/* Teacher Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAm ? "መምህር *" : "Teacher *"}
              </label>
              {teachersLoading ? (
                <Skeleton className="h-10 rounded-lg" />
              ) : (
                <Autocomplete
                  placeholder={isAm ? "መምህር ይፈልጉ..." : "Search for teacher..."}
                  selectedKey={selectedTeacher || null}
                  onSelectionChange={(key: React.Key | null) => {
                    setSelectedTeacher((key as string) || "");
                    setSelectedTeacherProgress(new Set());
                    setSelectedShiftTeacherData(new Set());
                  }}
                  defaultItems={teachers || []}
                  variant="bordered"
                  isClearable
                  listboxProps={{
                    emptyContent: isAm
                      ? "ምንም መምህር አልተገኘም"
                      : "No teachers found",
                  }}
                  description={
                    selectedTeacher
                      ? isAm
                        ? "✓ መምህር ተመርጧል"
                        : "✓ Teacher selected"
                      : isAm
                      ? "ለመፈለግ መታየብ ይጀምሩ"
                      : "Start typing to search"
                  }
                  classNames={{
                    base: selectedTeacher
                      ? "border-2 border-success-300 dark:border-success-600 rounded-lg"
                      : "",
                  }}
                >
                  {(teacher: {
                    id: string;
                    firstName: string;
                    fatherName: string;
                    lastName: string;
                  }) => (
                    <AutocompleteItem
                      key={teacher.id}
                      textValue={`${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`}
                    >
                      <div className="flex flex-col py-1">
                        <span className="font-medium">
                          {teacher.firstName} {teacher.fatherName}{" "}
                          {teacher.lastName}
                        </span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              )}
            </div>

            {/* Year and Month */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAm ? "ዓመት *" : "Year *"}
                </label>
                <Input
                  type="number"
                  value={year.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setYear(0);
                    } else {
                      const y = parseInt(value);
                      if (!isNaN(y)) {
                        setYear(y);
                      }
                    }
                  }}
                  placeholder="2024"
                  min={2000}
                  variant="bordered"
                  classNames={{
                    input:
                      year >= 2000
                        ? "border-success-300 dark:border-success-600"
                        : "",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAm ? "ወር *" : "Month *"}
                </label>
                <Input
                  type="number"
                  value={month.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setMonth(0);
                    } else {
                      const m = parseInt(value);
                      if (!isNaN(m) && m >= 0 && m <= 12) {
                        setMonth(m);
                      }
                    }
                  }}
                  placeholder="1-12"
                  min={1}
                  max={12}
                  variant="bordered"
                  description={
                    month < 1 || month > 12
                      ? isAm
                        ? "እባክዎ 1-12 መካከል ወር ያስገቡ"
                        : "Please enter month between 1-12"
                      : ""
                  }
                  classNames={{
                    input:
                      month >= 1 && month <= 12
                        ? "border-success-300 dark:border-success-600"
                        : "",
                  }}
                />
              </div>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAm ? "የአሃድ ዋጋ *" : "Unit Price *"}
              </label>
              <Input
                type="number"
                value={unitPrice.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setUnitPrice(0);
                  } else {
                    const price = parseFloat(value);
                    if (!isNaN(price)) {
                      setUnitPrice(price);
                    }
                  }
                }}
                placeholder={isAm ? "የአሃድ ዋጋ" : "Unit Price"}
                min={0}
                variant="bordered"
                endContent={<Calculator className="h-4 w-4 text-gray-400" />}
                classNames={{
                  input:
                    unitPrice > 0
                      ? "border-success-300 dark:border-success-600"
                      : "",
                }}
              />
            </div>

            {/* Teacher Progress Selection */}
            <div
              className={`transition-all ${
                selectedTeacher
                  ? "opacity-100"
                  : "opacity-50 pointer-events-none"
              }`}
            >
              <label className="block text-sm font-medium mb-2">
                {isAm ? "Teacher Progress" : "Teacher Progress"}
                {!selectedTeacher && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({isAm ? "አስቀድመው መምህር ይምረጡ" : "Select teacher first"})
                  </span>
                )}
              </label>
              {!selectedTeacher ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-500 text-center">
                    {isAm
                      ? "እባክዎ በመጀመሪያ መምህር ይምረጡ"
                      : "Please select a teacher first"}
                  </p>
                </div>
              ) : teacherProgressLoading ? (
                <Skeleton className="h-10 rounded-lg" />
              ) : teacherProgress && teacherProgress.length > 0 ? (
                <Select
                  placeholder={
                    isAm ? "Teacher Progress ይምረጡ" : "Select Teacher Progress"
                  }
                  selectionMode="multiple"
                  selectedKeys={selectedTeacherProgress}
                  onSelectionChange={(keys) =>
                    setSelectedTeacherProgress(keys as Set<string>)
                  }
                  classNames={{
                    trigger: selectedTeacher
                      ? "border-2 border-blue-300 dark:border-blue-600"
                      : "",
                  }}
                >
                  {teacherProgress.map((tp) => {
                    const createdDate = new Date(tp.createdAt);
                    const formattedDate = `${createdDate.getDate()}/${
                      createdDate.getMonth() + 1
                    }/${createdDate.getFullYear()}`;
                    return (
                      <SelectItem
                        key={tp.id}
                        textValue={`${tp.student.firstName} ${tp.student.fatherName} ${tp.student.lastName} - ${tp.learningCount} days`}
                      >
                        <div className="flex flex-col gap-1 py-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {tp.student.firstName} {tp.student.fatherName}{" "}
                              {tp.student.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formattedDate}
                            </span>
                          </div>
                          {tp.learningSlot && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                              {isAm ? "የመማሪያ ሰዓት" : "Learning Slot"}:{" "}
                              {tp.learningSlot}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-600 dark:text-green-400">
                              {isAm ? "የመማሪያ" : "Learning"}: {tp.learningCount}
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                              {isAm ? "የጠፋ" : "Missing"}: {tp.missingCount || 0}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {isAm ? "ጠቅላላ" : "Total"}: {tp.totalCount || 0}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              ) : (
                <>
                  <Select
                    placeholder={
                      isAm ? "Teacher Progress ይምረጡ" : "Select Teacher Progress"
                    }
                    selectionMode="multiple"
                    selectedKeys={selectedTeacherProgress}
                    onSelectionChange={(keys) =>
                      setSelectedTeacherProgress(keys as Set<string>)
                    }
                    isDisabled={true}
                    classNames={{
                      trigger: "border-2 border-gray-300 dark:border-gray-600",
                    }}
                  >
                    {[]}
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {isAm
                      ? "ምንም Teacher Progress አልተገኘም"
                      : "No Teacher Progress found"}
                  </p>
                </>
              )}
            </div>

            {/* Shift Teacher Data Selection */}
            <div
              className={`transition-all ${
                selectedTeacher
                  ? "opacity-100"
                  : "opacity-50 pointer-events-none"
              }`}
            >
              <label className="block text-sm font-medium mb-2">
                {isAm ? "Shift Teacher Data" : "Shift Teacher Data"}
                {!selectedTeacher && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({isAm ? "አስቀድመው መምህር ይምረጡ" : "Select teacher first"})
                  </span>
                )}
              </label>
              {!selectedTeacher ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-500 text-center">
                    {isAm
                      ? "እባክዎ በመጀመሪያ መምህር ይምረጡ"
                      : "Please select a teacher first"}
                  </p>
                </div>
              ) : shiftTeacherDataLoading ? (
                <Skeleton className="h-10 rounded-lg" />
              ) : shiftTeacherData && shiftTeacherData.length > 0 ? (
                <Select
                  placeholder={
                    isAm
                      ? "Shift Teacher Data ይምረጡ"
                      : "Select Shift Teacher Data"
                  }
                  selectionMode="multiple"
                  selectedKeys={selectedShiftTeacherData}
                  onSelectionChange={(keys) =>
                    setSelectedShiftTeacherData(keys as Set<string>)
                  }
                  classNames={{
                    trigger: selectedTeacher
                      ? "border-2 border-blue-300 dark:border-blue-600"
                      : "",
                  }}
                >
                  {shiftTeacherData.map((std) => {
                    const createdDate = new Date(std.createdAt);
                    const formattedDate = `${createdDate.getDate()}/${
                      createdDate.getMonth() + 1
                    }/${createdDate.getFullYear()}`;
                    return (
                      <SelectItem
                        key={std.id}
                        textValue={`${std.student.firstName} ${std.student.fatherName} ${std.student.lastName} - ${std.learningCount} days`}
                      >
                        <div className="flex flex-col gap-1 py-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {std.student.firstName} {std.student.fatherName}{" "}
                              {std.student.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formattedDate}
                            </span>
                          </div>
                          {std.learningSlot && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                              {isAm ? "የመማሪያ ሰዓት" : "Learning Slot"}:{" "}
                              {std.learningSlot}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-600 dark:text-green-400">
                              {isAm ? "የመማሪያ" : "Learning"}: {std.learningCount}
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                              {isAm ? "የጠፋ" : "Missing"}:{" "}
                              {std.missingCount || 0}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {isAm ? "ጠቅላላ" : "Total"}: {std.totalCount || 0}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              ) : (
                <>
                  <Select
                    placeholder={
                      isAm
                        ? "Shift Teacher Data ይምረጡ"
                        : "Select Shift Teacher Data"
                    }
                    selectionMode="multiple"
                    selectedKeys={selectedShiftTeacherData}
                    onSelectionChange={(keys) =>
                      setSelectedShiftTeacherData(keys as Set<string>)
                    }
                    isDisabled={true}
                    classNames={{
                      trigger: "border-2 border-gray-300 dark:border-gray-600",
                    }}
                  >
                    {[]}
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {isAm
                      ? "ምንም Shift Teacher Data አልተገኘም"
                      : "No Shift Teacher Data found"}
                  </p>
                </>
              )}
            </div>

            {/* Calculation Summary */}
            {(selectedTeacherProgress.size > 0 ||
              selectedShiftTeacherData.size > 0) && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardBody className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {isAm ? "የመማሪያ ቀናት" : "Total Learning Days"}:
                      </span>
                      <span className="font-semibold">
                        {calculations.totalDayForLearning}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {isAm ? "የአሃድ ዋጋ" : "Unit Price"}:
                      </span>
                      <span>{unitPrice.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-700 pt-2 flex justify-between">
                      <span className="font-bold text-lg">
                        {isAm ? "ጠቅላላ" : "Total Amount"}:
                      </span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {calculations.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              {isAm ? "ዝጋ" : "Cancel"}
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isCreating}
              isDisabled={
                !selectedTeacher ||
                (selectedTeacherProgress.size === 0 &&
                  selectedShiftTeacherData.size === 0) ||
                unitPrice <= 0
              }
            >
              {isAm ? "ይፍጠሩ" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedSalaryId("");
          setSelectedSalaryData(null);
          setConfirmAction(null);
        }}
        size="md"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-md",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  confirmAction === "approve"
                    ? "bg-success/10 border-2 border-success/20"
                    : "bg-danger/10 border-2 border-danger/20"
                }`}
              >
                <AlertTriangle
                  className={`size-6 ${
                    confirmAction === "approve" ? "text-success" : "text-danger"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold">
                {confirmAction === "approve"
                  ? isAm
                    ? "ደሞዝ ያጽድቁ"
                    : "Approve Salary"
                  : isAm
                  ? "ደሞዝ ይቃወሙ"
                  : "Reject Salary"}
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-700">
                {confirmAction === "approve"
                  ? isAm
                    ? "እርግጠኛ ነዎት ይህን ደሞዝ ማጽደቅ ይፈልጋሉ?"
                    : "Are you sure you want to approve this salary?"
                  : isAm
                  ? "እርግጠኛ ነዎት ይህን ደሞዝ መቃወም ይፈልጋሉ?"
                  : "Are you sure you want to reject this salary?"}
              </p>

              {/* Salary Details */}
              {selectedSalaryData && (
                <div className="p-4 bg-default-100 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">
                      {isAm ? "መምህር:" : "Teacher:"}
                    </span>
                    <span className="font-semibold">
                      {selectedSalaryData.teacher.firstName}{" "}
                      {selectedSalaryData.teacher.fatherName}{" "}
                      {selectedSalaryData.teacher.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">
                      {isAm ? "ወር/ዓመት:" : "Month/Year:"}
                    </span>
                    <span className="font-semibold">
                      {selectedSalaryData.month}/{selectedSalaryData.year}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">
                      {isAm ? "የመማሪያ ቀናት:" : "Learning Days:"}
                    </span>
                    <span className="font-semibold">
                      {selectedSalaryData.totalDayForLearning}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">
                      {isAm ? "የአሃድ ዋጋ:" : "Unit Price:"}
                    </span>
                    <span className="font-semibold">
                      {selectedSalaryData.unitPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-default-200">
                    <span className="font-bold">
                      {isAm ? "ጠቅላላ መጠን:" : "Total Amount:"}
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {selectedSalaryData.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Warning Message */}
              <div
                className={`p-3 rounded-lg ${
                  confirmAction === "approve"
                    ? "bg-success/10 border border-success/20"
                    : "bg-danger/10 border border-danger/20"
                }`}
              >
                <p
                  className={`text-sm ${
                    confirmAction === "approve"
                      ? "text-success-700 dark:text-success-400"
                      : "text-danger-700 dark:text-danger-400"
                  }`}
                >
                  {confirmAction === "approve"
                    ? isAm
                      ? "ይህ ድርጊት የደሞዝ ሁኔታን ወደ 'ጸድቋል' ይቀይራል። ይህ ተግባር መመለስ አይቻልም።"
                      : "This action will change the salary status to 'Approved'. This action cannot be undone."
                    : isAm
                    ? "ይህ ድርጊት የደሞዝ ሁኔታን ወደ 'ተቀባይነት አላገኘም' ይቀይራል። ይህ ተግባር መመለስ አይቻልም።"
                    : "This action will change the salary status to 'Rejected'. This action cannot be undone."}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsConfirmModalOpen(false);
                setSelectedSalaryId("");
                setSelectedSalaryData(null);
                setConfirmAction(null);
              }}
              isDisabled={isUpdating}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color={confirmAction === "approve" ? "success" : "danger"}
              onPress={handleConfirmAction}
              isLoading={isUpdating}
              startContent={
                confirmAction === "approve" ? (
                  <Check className="size-4" />
                ) : (
                  <X className="size-4" />
                )
              }
            >
              {confirmAction === "approve"
                ? isAm
                  ? "አዎ, ጸድቅ"
                  : "Yes, Approve"
                : isAm
                ? "አዎ, ቃወም"
                : "Yes, Reject"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Photo Upload Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          if (!isUpdating) {
            setIsPhotoModalOpen(false);
            setConfirmAction(null);
            removePhoto();
          }
        }}
        size="md"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-md",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 border-2 border-success/20">
                <Upload className="size-6 text-success" />
              </div>
              <h3 className="text-xl font-bold">
                {isAm ? "የክፍያ ፎቶ ይስቀሉ" : "Upload Payment Photo"}
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-700">
                {isAm
                  ? "ደሞዝን ለማጽደቅ እባክዎ የክፍያ ማረጋገጫ ፎቶ ይስቀሉ።"
                  : "Please upload payment proof photo to approve the salary."}
              </p>

              {/* Salary Details Summary */}
              {selectedSalaryData && (
                <div className="p-3 bg-default-100 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">
                      {isAm ? "መምህር:" : "Teacher:"}
                    </span>
                    <span className="font-semibold">
                      {selectedSalaryData.teacher.firstName}{" "}
                      {selectedSalaryData.teacher.fatherName}{" "}
                      {selectedSalaryData.teacher.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">
                      {isAm ? "መጠን:" : "Amount:"}
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {selectedSalaryData.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* File Upload Input */}
              <div>
                <label className="block mb-2 text-sm font-medium">
                  {isAm ? "ፎቶ ይምረጡ" : "Select Photo"} *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-success-50 file:text-success-700 hover:file:bg-success-100"
                  disabled={isUploading}
                />

                {/* Upload Progress */}
                {isUploading && uploadingPhoto && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{uploadingPhoto.name}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-default-200 rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Photo Preview */}
                {uploadedPhotoUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-default-600 mb-2">
                      {isAm ? "የተስቀለ ፎቶ" : "Uploaded Photo"}:
                    </p>
                    <div className="relative inline-block">
                      <Image
                        src={formatImageUrl(uploadedPhotoUrl)}
                        alt="Payment proof"
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <Button
                        size="sm"
                        color="danger"
                        className="absolute top-1 right-1"
                        onPress={removePhoto}
                        isIconOnly
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsPhotoModalOpen(false);
                setConfirmAction(null);
                removePhoto();
              }}
              isDisabled={isUpdating}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color="success"
              onPress={handleApproveWithPhoto}
              isLoading={isUpdating}
              isDisabled={!uploadedPhotoUrl || isUploading}
              startContent={<Check className="size-4" />}
            >
              {isAm ? "ጸድቅ" : "Approve"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Photo Preview Modal */}
      <Modal
        isOpen={isPhotoPreviewOpen}
        onClose={closePhotoPreview}
        size="md"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-md",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-default-200/80 dark:bg-default-700/60">
              <Eye className="size-6" />
            </div>
            <h3 className="text-xl font-bold">
              {isAm ? "የክፍያ ፎቶ" : "Payment Photo"}
            </h3>
          </ModalHeader>
          <ModalBody>
            {previewPhotoUrl ? (
              <div className="flex justify-center">
                <Image
                  src={formatImageUrl(previewPhotoUrl)}
                  alt="Payment photo preview"
                  width={320}
                  height={320}
                  className="max-h-[360px] w-auto object-contain rounded-lg border"
                />
              </div>
            ) : (
              <p className="text-center text-sm text-default-500">
                {isAm ? "ፎቶ የለም" : "No photo available"}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closePhotoPreview}>
              {isAm ? "ዝጋ" : "Close"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        isOpen={isAlertOpen}
        onClose={closeAlert}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        confirmText={alertOptions.confirmText || (isAm ? "እሺ" : "OK")}
        cancelText={alertOptions.cancelText}
        onConfirm={alertOptions.onConfirm}
        showCancel={alertOptions.showCancel}
      />
    </div>
  );
}

export default Page;
