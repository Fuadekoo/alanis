"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Autocomplete,
  AutocompleteItem,
  Skeleton,
  Chip,
  Select,
  SelectItem,
  Pagination,
} from "@/components/ui/heroui";
import {
  getAllTeachersForReporter,
  getTeacherProgressByTeacher,
} from "@/actions/manager/reporter";
import { Calendar, Search, TrendingUp } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";

interface TeacherRecord {
  id: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  username?: string;
}

interface ProgressRecord {
  id: string;
  createdAt?: string | Date;
  learningSlot?: string | null;
  learningCount?: number | null;
  missingCount?: number | null;
  totalCount?: number | null;
  progressStatus: string;
  paymentStatus: string;
  student: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    controller?: {
      firstName: string;
      fatherName: string;
      lastName: string;
    } | null;
  };
}

export default function Page() {
  const isAm = useAmharic();

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [teachersData, isLoadingTeachers] = useData(
    getAllTeachersForReporter,
    () => {}
  );

  const [progressData, isLoadingProgress, refreshProgress] = useData(
    getTeacherProgressByTeacher,
    () => {},
    selectedTeacherId || ""
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, month, year, selectedTeacherId, pageSize]);

  const currentTeacher = useMemo(() => {
    if (!teachersData?.data || !selectedTeacherId) return null;
    return (teachersData.data as TeacherRecord[]).find(
      (teacher) => teacher.id === selectedTeacherId
    );
  }, [teachersData?.data, selectedTeacherId]);

  const monthOptions = useMemo(() => {
    const base = isAm
      ? [
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
        ]
      : [
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
    return [
      { value: "all", label: isAm ? "ሁሉም ወራት" : "All months" },
      ...base.map((label, index) => ({
        value: String(index + 1),
        label,
      })),
    ];
  }, [isAm]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, idx) => currentYear - idx);
    return [
      { value: "all", label: isAm ? "ሁሉም ዓመታት" : "All years" },
      ...years.map((value) => ({ value: String(value), label: String(value) })),
    ];
  }, [isAm]);

  const pageSizeOptions = useMemo(
    () => [10, 25, 50, 100].map((size) => size.toString()),
    []
  );

  const progressList = useMemo(() => {
    if (!progressData?.success || !Array.isArray(progressData.data)) return [];
    return (progressData.data as unknown[]).map(
      (item) => item as ProgressRecord
    );
  }, [progressData]);

  const filteredProgress = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    return progressList.filter((progress) => {
      const createdAt = progress.createdAt
        ? new Date(progress.createdAt)
        : null;

      if (month !== "all") {
        if (!createdAt || createdAt.getMonth() + 1 !== Number(month)) {
          return false;
        }
      }

      if (year !== "all") {
        if (!createdAt || createdAt.getFullYear() !== Number(year)) {
          return false;
        }
      }

      if (!searchLower) return true;

      const studentText =
        `${progress.student.firstName} ${progress.student.fatherName} ${progress.student.lastName}`.toLowerCase();
      const controllerText = progress.student.controller
        ? `${progress.student.controller.firstName} ${progress.student.controller.fatherName} ${progress.student.controller.lastName}`.toLowerCase()
        : "";

      return (
        studentText.includes(searchLower) ||
        controllerText.includes(searchLower)
      );
    });
  }, [progressList, month, year, searchTerm]);

  const totalStudents = filteredProgress.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

  const paginatedProgress = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProgress.slice(start, start + pageSize);
  }, [filteredProgress, page, pageSize]);

  const paginationInfo = useMemo(() => {
    if (totalStudents === 0) return { start: 0, end: 0 };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalStudents);
    return { start, end };
  }, [page, pageSize, totalStudents]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 lg:p-6 gap-4">
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
              <TrendingUp className="size-6 text-primary" />
              {isAm ? "የመምህር ሂደት" : "Teacher Progress"}
            </h1>
            {currentTeacher && (
              <p className="text-xs text-default-500">
                {`${currentTeacher.firstName} ${currentTeacher.fatherName} ${currentTeacher.lastName}`}
              </p>
            )}
          </div>

          <div className="w-full lg:max-w-sm">
            <Autocomplete
              placeholder={isAm ? "መምህር ይፈልጉ..." : "Search teacher..."}
              selectedKey={selectedTeacherId || null}
              onSelectionChange={(key: React.Key | null) => {
                const value = (key as string) || "";
                setSelectedTeacherId(value);
                setPage(1);
              }}
              defaultItems={(teachersData?.data as TeacherRecord[]) || []}
              isLoading={isLoadingTeachers}
              variant="bordered"
              size="sm"
              isClearable
              listboxProps={{
                emptyContent: isAm ? "መምህር አልተገኘም" : "No teachers found",
              }}
            >
              {(teacher: TeacherRecord) => (
                <AutocompleteItem
                  key={teacher.id}
                  textValue={`${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`}
                  className="py-1 text-sm"
                >
                  {teacher.firstName} {teacher.fatherName} {teacher.lastName}
                </AutocompleteItem>
              )}
            </Autocomplete>
          </div>
        </CardBody>
      </Card>

      {selectedTeacherId ? (
        <Card className="flex-1 overflow-hidden border border-default-200/70 shadow-sm">
          <CardHeader className="p-4 border-b border-default-200 bg-default-50 dark:bg-default-900/30">
            <div className="flex items-center gap-2 w-full">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isAm
                    ? "ተማሪን በፍጥነት ለመፈለግ ይጻፉ..."
                    : "Quick search for a student..."
                }
                variant="bordered"
                size="sm"
                startContent={<Search className="size-4 text-default-400" />}
                className="flex-1 min-w-0"
              />
              <Select
                aria-label="month"
                selectedKeys={new Set([month])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setMonth(value);
                }}
                variant="bordered"
                size="sm"
                className="w-[130px] flex-shrink"
              >
                {monthOptions.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
              <Select
                aria-label="year"
                selectedKeys={new Set([year])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setYear(value);
                }}
                variant="bordered"
                size="sm"
                className="w-[110px] flex-shrink"
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
                  setPageSize(Number(value));
                }}
                variant="bordered"
                size="sm"
                className="w-[120px] flex-shrink"
              >
                {pageSizeOptions.map((value) => (
                  <SelectItem key={value}>{value}</SelectItem>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardBody className="p-0 bg-default-50 dark:bg-default-950">
            {isLoadingProgress ? (
              <div className="p-4">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>
            ) : progressData?.success ? (
              filteredProgress.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur z-10">
                        <tr>
                          <th className="border border-default-200 p-3 text-left font-semibold min-w-[200px]">
                            {isAm ? "ተማሪ" : "Student"}
                          </th>
                          <th className="border border-default-200 p-3 text-left font-semibold min-w-[160px]">
                            {isAm ? "ተቆጣጣሪ" : "Controller"}
                          </th>
                          <th className="border border-default-200 p-3 text-left font-semibold min-w-[120px]">
                            {isAm ? "ተፈጥሯበት" : "Created"}
                          </th>
                          <th className="border border-default-200 p-3 text-center font-semibold min-w-[140px]">
                            {isAm ? "የትምህርት ሰዓት" : "Learning Slot"}
                          </th>
                          <th className="border border-default-200 p-3 text-center font-semibold">
                            {isAm ? "መማሪያ" : "Learning"}
                          </th>
                          <th className="border border-default-200 p-3 text-center font-semibold">
                            {isAm ? "የጠፋ" : "Missing"}
                          </th>
                          <th className="border border-default-200 p-3 text-center font-semibold">
                            {isAm ? "ጠቅላላ" : "Total"}
                          </th>
                          <th className="border border-default-200 p-3 text-center font-semibold">
                            {isAm ? "ሂደት" : "Progress"}
                          </th>
                          <th className="border border-default-200 p-3 text-center font-semibold">
                            {isAm ? "ክፍያ" : "Payment"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProgress.map((progress) => {
                          const createdAt = progress.createdAt
                            ? new Date(progress.createdAt)
                            : null;
                          return (
                            <tr
                              key={progress.id}
                              className="hover:bg-primary/5 transition-colors"
                            >
                              <td className="border border-default-200 p-3">
                                <span className="font-medium text-sm">
                                  {progress.student.firstName}{" "}
                                  {progress.student.fatherName}{" "}
                                  {progress.student.lastName}
                                </span>
                              </td>
                              <td className="border border-default-200 p-3 text-sm">
                                {progress.student.controller ? (
                                  `${progress.student.controller.firstName} ${progress.student.controller.fatherName} ${progress.student.controller.lastName}`
                                ) : (
                                  <span className="text-default-400">
                                    {isAm ? "የለም" : "None"}
                                  </span>
                                )}
                              </td>
                              <td className="border border-default-200 p-3 text-sm">
                                {createdAt
                                  ? createdAt.toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="border border-default-200 p-3 text-center text-sm">
                                {progress.learningSlot || "-"}
                              </td>
                              <td className="border border-default-200 p-3 text-center">
                                <Chip color="success" size="sm" variant="flat">
                                  {progress.learningCount ?? 0}
                                </Chip>
                              </td>
                              <td className="border border-default-200 p-3 text-center">
                                <Chip color="danger" size="sm" variant="flat">
                                  {progress.missingCount ?? 0}
                                </Chip>
                              </td>
                              <td className="border border-default-200 p-3 text-center">
                                <Chip color="primary" size="sm" variant="flat">
                                  {progress.totalCount ?? 0}
                                </Chip>
                              </td>
                              <td className="border border-default-200 p-3 text-center">
                                <Chip
                                  size="sm"
                                  color={
                                    progress.progressStatus === "open"
                                      ? "success"
                                      : "default"
                                  }
                                  variant="dot"
                                >
                                  {progress.progressStatus === "open"
                                    ? isAm
                                      ? "ክፍት"
                                      : "Open"
                                    : isAm
                                    ? "ዝግ"
                                    : "Closed"}
                                </Chip>
                              </td>
                              <td className="border border-default-200 p-3 text-center">
                                <Chip
                                  size="sm"
                                  color={
                                    progress.paymentStatus === "approved"
                                      ? "success"
                                      : progress.paymentStatus === "pending"
                                      ? "warning"
                                      : "danger"
                                  }
                                  variant="dot"
                                >
                                  {progress.paymentStatus === "approved"
                                    ? isAm
                                      ? "ጸድቋል"
                                      : "Paid"
                                    : progress.paymentStatus === "pending"
                                    ? isAm
                                      ? "በመጠባበቅ ላይ"
                                      : "Pending"
                                    : isAm
                                    ? "ተቀባይነት አላገኘም"
                                    : "Rejected"}
                                </Chip>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 pb-4">
                    <span className="text-xs text-default-500">
                      {totalStudents > 0
                        ? isAm
                          ? `ውጤቶች ${paginationInfo.start}-${paginationInfo.end} ከ ${totalStudents}`
                          : `Showing ${paginationInfo.start}-${paginationInfo.end} of ${totalStudents}`
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
                <div className="p-12 text-center text-default-500">
                  <Calendar className="size-20 text-default-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-default-600 mb-2">
                    {isAm
                      ? "የተመረጠው መምህር ላይ ተማሪ አልተገኘም"
                      : "No progress found for this teacher"}
                  </h3>
                  <p className="text-sm text-default-400">
                    {isAm
                      ? "የፍለጋ እና ወር/ዓመት ማጣሪያዎችን ይቀይሩ"
                      : "Adjust your search or month/year filters."}
                  </p>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-danger">
                {isAm ? "መረጃ ማግኘት አልተሳካም" : "Failed to load data"}
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="flex-1">
          <CardBody className="flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
              <Calendar className="size-20 text-default-300 mx-auto" />
              <h3 className="text-xl font-semibold text-default-600">
                {isAm ? "መምህር ይምረጡ" : "Select a Teacher"}
              </h3>
              <p className="text-sm text-default-400">
                {isAm
                  ? "የመምህር ሂደቶችን ለማየት ከላይ መምህር ይምረጡ። ወርና ዓመት ማጣሪያዎችን በመጠቀም ውጤቶቹን ያጠናቀቁ።"
                  : "Choose a teacher above to review their active teaching progress, then refine by month, year, or student search."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
