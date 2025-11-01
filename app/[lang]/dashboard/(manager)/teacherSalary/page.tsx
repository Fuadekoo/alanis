"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Skeleton,
} from "@/components/ui/heroui";
import { Plus, Calculator, Check, X, AlertTriangle } from "lucide-react";
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

function Page() {
  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [selectedSalaryId, setSelectedSalaryId] = useState<string>("");
  const [selectedSalaryData, setSelectedSalaryData] = useState<any>(null);
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
    salary: any,
    action: "approve" | "reject"
  ) => {
    setSelectedSalaryId(salaryId);
    setSelectedSalaryData(salary);
    setConfirmAction(action);
    setIsConfirmModalOpen(true);
  };

  // Handle approve/reject salary
  const handleConfirmAction = async () => {
    if (!selectedSalaryId || !confirmAction) return;

    setIsUpdating(true);
    try {
      const newStatus =
        confirmAction === "approve"
          ? paymentStatus.approved
          : paymentStatus.rejected;
      const result = await updateSalary(selectedSalaryId, newStatus);

      if (result) {
        setIsConfirmModalOpen(false);
        setSelectedSalaryId("");
        setSelectedSalaryData(null);
        setConfirmAction(null);
        if (refreshSalaries) {
          refreshSalaries();
        }
        showAlert({
          message:
            confirmAction === "approve"
              ? isAm
                ? "ደሞዝ በተሳካ ሁኔታ ጸድቋል!"
                : "Salary approved successfully!"
              : isAm
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
    } catch (error) {
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
      renderCell: (item: any) => (
        <span>
          {item.teacher.firstName} {item.teacher.fatherName}{" "}
          {item.teacher.lastName}
        </span>
      ),
    },
    {
      key: "month",
      label: isAm ? "ወር" : "Month",
      renderCell: (item: any) => <span>{item.month}</span>,
    },
    {
      key: "year",
      label: isAm ? "ዓመት" : "Year",
      renderCell: (item: any) => <span>{item.year}</span>,
    },
    {
      key: "totalDayForLearning",
      label: isAm ? "የመማሪያ ቀናት" : "Learning Days",
      renderCell: (item: any) => <span>{item.totalDayForLearning}</span>,
    },
    {
      key: "unitPrice",
      label: isAm ? "የአሃድ ዋጋ" : "Unit Price",
      renderCell: (item: any) => <span>{item.unitPrice.toLocaleString()}</span>,
    },
    {
      key: "amount",
      label: isAm ? "ጠቅላላ" : "Total Amount",
      renderCell: (item: any) => (
        <span className="font-semibold">{item.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      label: isAm ? "ሁኔታ" : "Status",
      renderCell: (item: any) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            item.status === paymentStatus.approved
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : item.status === paymentStatus.rejected
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: isAm ? "የተፈጠረበት ቀን" : "Created At",
      renderCell: (item: any) => (
        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: isAm ? "ድርጊቶች" : "Actions",
      renderCell: (item: any) => (
        <div className="flex gap-2">
          {item.status === paymentStatus.pending && (
            <>
              <Button
                size="sm"
                color="success"
                variant="flat"
                startContent={<Check className="size-3" />}
                onPress={() => openConfirmModal(item.id, item, "approve")}
              >
                {isAm ? "ጸድቅ" : "Approve"}
              </Button>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                startContent={<X className="size-3" />}
                onPress={() => openConfirmModal(item.id, item, "reject")}
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
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isAm ? "መምህር ደሞዝ" : "Teacher Salary"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isAm
                ? "መምህሮችን ደሞዝ ይፈጥሩ ያስተዳድሩ"
                : "Create and manage teacher salaries"}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => setIsModalOpen(true)}
          >
            {isAm ? "አዲስ ደሞዝ ይፍጠሩ" : "Create Salary"}
          </Button>
        </div>
      </div>

      {/* Salary Table - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                <Select
                  placeholder={isAm ? "መምህር ይምረጡ" : "Select Teacher"}
                  selectedKeys={selectedTeacher ? [selectedTeacher] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedTeacher(selected || "");
                    setSelectedTeacherProgress(new Set());
                    setSelectedShiftTeacherData(new Set());
                  }}
                >
                  {(teachers || []).map((teacher) => (
                    <SelectItem key={teacher.id}>
                      {teacher.firstName} {teacher.fatherName}{" "}
                      {teacher.lastName}
                    </SelectItem>
                  ))}
                </Select>
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
                  onValueChange={(value) => setYear(parseInt(value) || 0)}
                  placeholder="2024"
                  min={2000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAm ? "ወር *" : "Month *"}
                </label>
                <Input
                  type="number"
                  value={month.toString()}
                  onValueChange={(value) => {
                    const m = parseInt(value) || 0;
                    if (m >= 1 && m <= 12) {
                      setMonth(m);
                    }
                  }}
                  placeholder="1-12"
                  min={1}
                  max={12}
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
                onValueChange={(value) => setUnitPrice(parseFloat(value) || 0)}
                placeholder={isAm ? "የአሃድ ዋጋ" : "Unit Price"}
                min={0}
                endContent={<Calculator className="h-4 w-4 text-gray-400" />}
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
                        textValue={`${tp.student.firstName} ${tp.student.lastName} - ${tp.learningCount} days`}
                      >
                        <div className="flex flex-col gap-1 py-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {tp.student.firstName} {tp.student.lastName}
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
                        textValue={`${std.student.firstName} ${std.student.lastName} - ${std.learningCount} days`}
                      >
                        <div className="flex flex-col gap-1 py-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {std.student.firstName} {std.student.lastName}
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
