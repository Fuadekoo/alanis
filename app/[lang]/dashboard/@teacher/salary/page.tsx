"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Pagination,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from "@/components/ui/heroui";
import { Calendar, Eye, Info } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import {
  getTeacherSalaries,
  getTeacherSalaryDetail,
} from "@/actions/teacher/salary";

interface TeacherSalaryRow {
  id: string;
  month: number;
  year: number;
  totalDayForLearning: number;
  unitPrice: number;
  amount: number;
  status: "pending" | "approved" | "rejected";
  paymentPhoto?: string | null;
  createdAt: Date | string;
}

interface SalaryDetail extends TeacherSalaryRow {
  teacherProgresses: Array<{
    id: string;
    learningCount: number;
    missingCount: number;
    totalCount: number;
    paymentStatus: string;
    createdAt: Date | string;
    student: {
      firstName: string;
      fatherName: string;
      lastName: string;
    };
  }>;
  shiftTeacherData: Array<{
    id: string;
    learningCount: number;
    missingCount: number;
    totalCount: number;
    paymentStatus: string;
    createdAt: Date | string;
    student: {
      firstName: string;
      fatherName: string;
      lastName: string;
    };
  }>;
}

function formatCurrency(value: number) {
  return value.toLocaleString();
}

function formatMonthLabel(month: number, isAm: boolean) {
  const amLabels = [
    "መስከረም",
    "ጥቅምት",
    "ህዳር",
    "ታህሳስ",
    "ጥር",
    "የካቲት",
    "መጋቢት",
    "ሚያዝያ",
    "ግንቦት",
    "ሰኔ",
    "ሐምሌ",
    "ነሐሴ",
  ];

  const enLabels = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const labels = isAm ? amLabels : enLabels;
  if (month < 1 || month > 12) return "-";
  return labels[month - 1];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        className:
          "inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-200",
      };
    case "pending":
      return {
        label: "Pending",
        className:
          "inline-flex items-center rounded-full bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-200",
      };
    default:
      return {
        label: "Rejected",
        className:
          "inline-flex items-center rounded-full bg-danger-50 px-2 py-0.5 text-xs font-semibold text-danger-600 dark:bg-danger-500/10 dark:text-danger-200",
      };
  }
}

export default function Page() {
  const isAm = useAmharic();

  const [filterMonth, setFilterMonth] = useState<number | undefined>(
    undefined
  );
  const [filterYear, setFilterYear] = useState<number | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSalary, setSelectedSalary] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("");

  const [salaryResponse, isLoadingSalaries] = useData(
    getTeacherSalaries,
    () => {},
    filterYear,
    filterMonth,
    page,
    pageSize
  );

  const [salaryDetail] = useData(
    getTeacherSalaryDetail,
    () => {},
    selectedSalary
  );

  const salaryData = salaryResponse?.data?.salaries ?? [];
  const totalCount = salaryResponse?.data?.totalCount ?? 0;
  const totalPages = salaryResponse?.data?.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [filterMonth, filterYear, pageSize]);

  const monthOptions = useMemo(() => {
    return [
      { value: "all", label: isAm ? "ሁሉም ወራት" : "All months" },
      ...Array.from({ length: 12 }, (_, index) => ({
        value: (index + 1).toString(),
        label: isAm ? `${index + 1}` : `${index + 1}`,
      })),
    ];
  }, [isAm]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: "all", label: isAm ? "ሁሉም ዓመታት" : "All years" },
      ...Array.from({ length: 7 }, (_, idx) => currentYear - 3 + idx).map(
        (value) => ({
          value: value.toString(),
          label: value.toString(),
        })
      ),
    ];
  }, [isAm]);

  const pageSizeOptions = useMemo(
    () => [5, 10, 25, 50].map((value) => value.toString()),
    []
  );

  const selectedDetail = salaryDetail?.success
    ? (salaryDetail.data as SalaryDetail)
    : null;

  const openDetailModal = (salary: TeacherSalaryRow) => {
    if (!salary.id) return;
    setSelectedSalary(salary.id);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSalary("");
  };

  const openPhotoModal = (url: string | null | undefined) => {
    if (!url) return;
    setPhotoPreviewUrl(`/api/filedata/${encodeURIComponent(url)}`);
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setPhotoPreviewUrl("");
  };

  return (
    <div className="h-full overflow-hidden p-3 sm:p-5 space-y-4">
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Calendar className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-default-900">
                {isAm ? "የደሞዝ መግለጫ" : "My Salaries"}
              </h1>
              <p className="text-sm text-default-500">
                {isAm
                  ? "በሚከተሉት ወራት ለራስዎ የተሰጠ ደሞዝ ዝርዝር ይመልከቱ፣ ዝርዝሮችንም ይመልከቱ"
                  : "Review your monthly salary payouts and inspect full details."}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <div className="flex flex-col gap-2 flex-1 lg:flex-row lg:items-end lg:gap-2">
              <div className="text-xs text-default-500">
                {isAm
                  ? "ወርና ዓመት በመመርመር የራስዎን ደሞዝ ዝርዝር ይመልከቱ"
                  : "Use the filters to browse your monthly salary records."}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  aria-label="month"
                  selectedKeys={
                    new Set([filterMonth ? filterMonth.toString() : "all"])
                  }
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    if (!value || value === "all") {
                      setFilterMonth(undefined);
                    } else {
                      setFilterMonth(parseInt(value, 10));
                    }
                  }}
                  variant="bordered"
                  size="sm"
                  className="sm:w-[160px]"
                >
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  aria-label="year"
                  selectedKeys={
                    new Set([filterYear ? filterYear.toString() : "all"])
                  }
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    if (!value || value === "all") {
                      setFilterYear(undefined);
                    } else {
                      setFilterYear(parseInt(value, 10));
                    }
                  }}
                  variant="bordered"
                  size="sm"
                  className="sm:w-[140px]"
                >
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  aria-label="rows per page"
                  selectedKeys={new Set([pageSize.toString()])}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    if (value) setPageSize(parseInt(value, 10));
                  }}
                  variant="bordered"
                  size="sm"
                  className="sm:w-[150px]"
                >
                  {pageSizeOptions.map((value) => (
                    <SelectItem key={value}>{value}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex-1 overflow-hidden border border-default-200/60 shadow-sm">
        <CardBody className="p-0 bg-default-50 dark:bg-default-950">
          {isLoadingSalaries ? (
            <div className="p-4">
              <Skeleton className="w-full h-80 rounded-lg" />
            </div>
          ) : salaryResponse?.success ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                    <tr>
                      <th className="border border-default-200/70 p-3 text-left font-semibold min-w-[120px]">
                        {isAm ? "ወር" : "Month"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-left font-semibold min-w-[100px]">
                        {isAm ? "ዓመት" : "Year"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[120px]">
                        {isAm ? "የመማሪያ ቀናት" : "Learning Days"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[120px]">
                        {isAm ? "የአሃድ ዋጋ" : "Unit Price"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[140px]">
                        {isAm ? "ጠቅላላ" : "Total Amount"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[140px]">
                        {isAm ? "ሁኔታ" : "Status"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[140px]">
                        {isAm ? "ተፈጥሯበት" : "Created"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[140px]">
                        {isAm ? "ፎቶ" : "Photo"}
                      </th>
                      <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[120px]">
                        {isAm ? "ተግባር" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryData.length > 0 ? (
                      salaryData.map((row: TeacherSalaryRow) => {
                        const badge = getStatusBadge(row.status);
                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                          >
                            <td className="border border-default-200/60 p-3 text-sm font-medium text-default-800">
                              {formatMonthLabel(row.month, isAm)}
                            </td>
                            <td className="border border-default-200/60 p-3 text-sm text-default-700">
                              {row.year}
                            </td>
                            <td className="border border-default-200/60 p-3 text-center">
                              <span className="inline-flex min-w-[2.5rem] justify-center rounded-full bg-default-100 px-2 py-0.5 text-xs font-semibold text-default-700 dark:bg-default-800/70 dark:text-default-200">
                                {row.totalDayForLearning}
                              </span>
                            </td>
                            <td className="border border-default-200/60 p-3 text-center">
                              <span className="inline-flex min-w-[2.5rem] justify-center rounded-full bg-default-100 px-2 py-0.5 text-xs font-semibold text-default-700 dark:bg-default-800/70 dark:text-default-200">
                                {formatCurrency(row.unitPrice)}
                              </span>
                            </td>
                            <td className="border border-default-200/60 p-3 text-center">
                              <span className="inline-flex min-w-[2.5rem] justify-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-200">
                                {formatCurrency(row.amount)}
                              </span>
                            </td>
                            <td className="border border-default-200/60 p-3 text-center">
                              <span className={badge.className}>
                                {isAm
                                  ? row.status === "approved"
                                    ? "ጸድቋል"
                                    : row.status === "pending"
                                    ? "በመጠባበቅ"
                                    : "ተቀባይነት አልተገኘም"
                                  : badge.label}
                              </span>
                            </td>
                            <td className="border border-default-200/60 p-3 text-center text-default-600">
                              {new Date(row.createdAt).toLocaleDateString()}
                            </td>
                            <td className="border border-default-200/60 p-3 text-center">
                              {row.paymentPhoto ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPhotoModal(row.paymentPhoto)
                                  }
                                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Eye className="size-4" />
                                  {isAm ? "ፎቶ ይመልከቱ" : "View"}
                                </button>
                              ) : (
                                <span className="text-xs text-default-400">
                                  {isAm ? "ፎቶ የለም" : "No photo"}
                                </span>
                              )}
                            </td>
                            <td className="border border-default-200/60 p-3 text-center">
                              <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                isIconOnly
                                aria-label={isAm ? "ዝርዝር" : "Details"}
                                onPress={() => openDetailModal(row)}
                              >
                                <Info className="size-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="border border-default-200/60 p-8 text-center text-default-500"
                        >
                          {isAm
                            ? "ምንም የደሞዝ መዝገብ አልተገኘም።"
                            : "No salary records found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 pb-4">
                <span className="text-xs text-default-500">
                  {totalCount > 0
                    ? isAm
                      ? `ውጤቶች ${(page - 1) * pageSize + 1}-${Math.min(
                          page * pageSize,
                          totalCount
                        )} ከ ${totalCount}`
                      : `Showing ${(page - 1) * pageSize + 1}-${Math.min(
                          page * pageSize,
                          totalCount
                        )} of ${totalCount}`
                    : isAm
                    ? "ውጤት የለም"
                    : "No results"}
                </span>
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={setPage}
                  showControls
                  isCompact
                  className="self-end"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-default-500">
              {isAm
                ? salaryResponse?.error || "የደሞዝ መረጃ ማግኘት አልተሳካም"
                : salaryResponse?.error || "Failed to load salaries."}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
              {isAm ? "ዝርዝር የደሞዝ" : "Salary Details"}
            </h2>
            {selectedDetail && (
              <p className="text-sm text-default-500">
                {formatMonthLabel(selectedDetail.month, isAm)}{" "}
                {selectedDetail.year} • {isAm ? "ጠቅላላ" : "Total"}:{" "}
                {formatCurrency(selectedDetail.amount)}
              </p>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedDetail ? (
              <div className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "የመማሪያ ቀናት" : "Learning days"}
                    </span>
                    <span className="font-semibold text-default-900">
                      {selectedDetail.totalDayForLearning}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "የአሃድ ዋጋ" : "Unit price"}
                    </span>
                    <span className="font-semibold text-default-900">
                      {formatCurrency(selectedDetail.unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "የተፈጠረበት ቀን" : "Created"}
                    </span>
                    <span className="font-semibold text-default-900">
                      {new Date(selectedDetail.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "ሁኔታ" : "Status"}
                    </span>
                    <span
                      className={
                        getStatusBadge(selectedDetail.status).className
                      }
                    >
                      {isAm
                        ? selectedDetail.status === "approved"
                          ? "ጸድቋል"
                          : selectedDetail.status === "pending"
                          ? "በመጠባበቅ"
                          : "ተቀባይነት አልተገኘም"
                        : getStatusBadge(selectedDetail.status).label}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {isAm ? "Teacher Progress" : "Teacher Progress"}
                    </h3>
                    <Chip size="sm" variant="flat" color="primary">
                      {selectedDetail.teacherProgresses.length}
                    </Chip>
                  </div>
                  {selectedDetail.teacherProgresses.length > 0 ? (
                    <div className="overflow-auto rounded-lg border border-default-200">
                      <table className="w-full text-xs">
                        <thead className="bg-default-100 dark:bg-default-900/80 text-default-500">
                          <tr>
                            <th className="px-3 py-2 text-left">
                              {isAm ? "ተማሪ" : "Student"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "መማሪያ" : "Learning"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "የጠፋ" : "Missing"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "ጠቅላላ" : "Total"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "ቀን" : "Date"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.teacherProgresses.map((progress) => (
                            <tr
                              key={progress.id}
                              className="border-t border-default-200/70"
                            >
                              <td className="px-3 py-2 font-medium text-default-800">
                                {progress.student.firstName}{" "}
                                {progress.student.fatherName}{" "}
                                {progress.student.lastName}
                              </td>
                              <td className="px-3 py-2 text-center text-default-700">
                                {progress.learningCount}
                              </td>
                              <td className="px-3 py-2 text-center text-default-700">
                                {progress.missingCount}
                              </td>
                              <td className="px-3 py-2 text-center text-default-700">
                                {progress.totalCount}
                              </td>
                              <td className="px-3 py-2 text-center text-default-500">
                                {new Date(
                                  progress.createdAt
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-default-500">
                      {isAm
                        ? "ከዚህ ደሞዝ ጋር የተያያዙ የመምህር ሂደት መረጃዎች የሉም።"
                        : "No teacher progress records linked."}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {isAm ? "Shift Data" : "Shift Data"}
                    </h3>
                    <Chip size="sm" variant="flat" color="primary">
                      {selectedDetail.shiftTeacherData.length}
                    </Chip>
                  </div>
                  {selectedDetail.shiftTeacherData.length > 0 ? (
                    <div className="overflow-auto rounded-lg border border-default-200">
                      <table className="w-full text-xs">
                        <thead className="bg-default-100 dark:bg-default-900/80 text-default-500">
                          <tr>
                            <th className="px-3 py-2 text-left">
                              {isAm ? "ተማሪ" : "Student"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "መማሪያ" : "Learning"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "የጠፋ" : "Missing"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "ጠቅላላ" : "Total"}
                            </th>
                            <th className="px-3 py-2 text-center">
                              {isAm ? "ቀን" : "Date"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.shiftTeacherData.map((shift) => (
                            <tr
                              key={shift.id}
                              className="border-t border-default-200/70"
                            >
                              <td className="px-3 py-2 font-medium text-default-800">
                                {shift.student.firstName}{" "}
                                {shift.student.fatherName}{" "}
                                {shift.student.lastName}
                              </td>
                              <td className="px-3 py-2 text-center text-default-700">
                                {shift.learningCount}
                              </td>
                              <td className="px-3 py-2 text-center text-default-700">
                                {shift.missingCount}
                              </td>
                              <td className="px-3 py-2 text-center text-default-700">
                                {shift.totalCount}
                              </td>
                              <td className="px-3 py-2 text-center text-default-500">
                                {new Date(shift.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-default-500">
                      {isAm
                        ? "ከዚህ ደሞዝ ጋር የተያያዙ shift መረጃዎች የሉም።"
                        : "No shift data linked to this salary."}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-default-500">
                {isAm ? "ዝርዝር መረጃ አልተገኘም" : "No detail information available."}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeDetailModal}>
              {isAm ? "ዝጋ" : "Close"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isPhotoModalOpen} onClose={closePhotoModal} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {isAm ? "የክፍያ ፎቶ" : "Payment Photo"}
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex justify-center">
              {photoPreviewUrl ? (
                <Image
                  src={photoPreviewUrl}
                  alt="Payment proof"
                  width={320}
                  height={320}
                  className="rounded-lg border"
                />
              ) : (
                <span className="text-default-500 text-sm">
                  {isAm ? "ፎቶ የለም" : "No photo available"}
                </span>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closePhotoModal}>
              {isAm ? "ዝጋ" : "Close"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
