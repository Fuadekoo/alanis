"use client";

import React, { useMemo, useState } from "react";
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
import { getAllShiftData } from "@/actions/manager/reporter";
import { getAllTeachersForReporter } from "@/actions/manager/reporter";
import { Search, History } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";

interface TeacherRecord {
  id: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  username?: string;
}

interface ShiftRecord {
  id: string;
  createdAt: string;
  learningSlot?: string | null;
  learningCount: number;
  missingCount: number;
  totalCount: number;
  paymentStatus: string;
  student: {
    firstName: string;
    fatherName: string;
    lastName: string;
    controller?: {
      firstName: string;
      fatherName: string;
      lastName: string;
    } | null;
  };
  teacher: {
    firstName: string;
    fatherName: string;
    lastName: string;
  };
}

export default function Page() {
  const isAm = useAmharic();

  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [teachersData, isLoadingTeachers] = useData(
    getAllTeachersForReporter,
    () => {}
  );

  const [shiftData, isLoadingShifts] = useData(
    getAllShiftData,
    () => {},
    page,
    pageSize,
    searchTerm,
    selectedTeacherId === "all" ? undefined : selectedTeacherId,
    month === "all" ? undefined : Number(month),
    year === "all" ? undefined : Number(year)
  );

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
      ...base.map((label, idx) => ({ value: String(idx + 1), label })),
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
    () => [10, 25, 50, 100].map((value) => value.toString()),
    []
  );

  const shiftRecords = useMemo(() => {
    if (!shiftData?.success || !shiftData.data?.shiftData) return [];
    return (shiftData.data.shiftData as unknown[]).map(
      (item) => item as ShiftRecord
    );
  }, [shiftData]);

  const teacherOptions = useMemo(() => {
    const list = (teachersData?.data as TeacherRecord[]) || [];
    return [
      { value: "all", label: isAm ? "ሁሉም መምህሮች" : "All teachers" },
      ...list.map((teacher) => ({
        value: teacher.id,
        label: `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`,
      })),
    ];
  }, [teachersData?.data, isAm]);

  const totalCount = shiftData?.data?.totalCount ?? 0;
  const totalPages =
    shiftData?.data?.totalPages ??
    Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 lg:p-6 gap-4">
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
              <History className="size-6 text-primary" />
              {isAm ? "የመምህር ለውጥ ታሪክ" : "Teacher Shift History"}
            </h1>
            <p className="text-xs text-default-500 max-w-2xl">
              {isAm
                ? "መምህር ይምረጡ ወይም ተማሪ ይፈልጉ፣ ወርና ዓመት በመጠቀም ማጣሪያዎችን ያጠናቀቁ፣ ከዚያም የታሪክ ማስተላለፊያዎችን ይመልከቱ።"
                : "Select a teacher or search by student, refine with month/year filters, and review historical shift records."}
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <Autocomplete
              placeholder={isAm ? "መምህር ይፈልጉ..." : "Search teacher..."}
              selectedKey={selectedTeacherId || "all"}
              onSelectionChange={(key: React.Key | null) => {
                const value = (key as string) || "all";
                setSelectedTeacherId(value);
                setPage(1);
              }}
              defaultItems={teacherOptions}
              variant="bordered"
              size="sm"
              isClearable
              isLoading={isLoadingTeachers}
              listboxProps={{
                emptyContent: isAm ? "መምህር አልተገኘም" : "No teachers found",
              }}
            >
              {(teacher: { value: string; label: string }) => (
                <AutocompleteItem key={teacher.value} textValue={teacher.label}>
                  {teacher.label}
                </AutocompleteItem>
              )}
            </Autocomplete>
          </div>
        </CardBody>
      </Card>

      <Card className="flex-1 overflow-hidden border border-default-200/70 shadow-sm">
        <CardHeader className="p-4 border-b border-default-200 bg-default-50 dark:bg-default-900/30">
          <div className="flex items-center gap-2 w-full">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isAm
                  ? "ተማሪ ወይም መምህር በፍጥነት ለመፈለግ..."
                  : "Quick search (student or teacher)..."
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
          {isLoadingShifts ? (
            <div className="p-4">
              <Skeleton className="w-full h-96 rounded-lg" />
            </div>
          ) : shiftData?.success && shiftRecords.length ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                    <tr>
                      <th className="border border-default-200 p-3 text-left font-semibold min-w-[180px]">
                        {isAm ? "ተማሪ" : "Student"}
                      </th>
                      <th className="border border-default-200 p-3 text-left font-semibold min-w-[180px]">
                        {isAm ? "መምህር" : "Teacher"}
                      </th>
                      <th className="border border-default-200 p-3 text-left font-semibold min-w-[160px]">
                        {isAm ? "ተቆጣጣሪ" : "Controller"}
                      </th>
                      <th className="border border-default-200 p-3 text-left font-semibold min-w-[120px]">
                        {isAm ? "ተፈጥሯበት" : "Created"}
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
                        {isAm ? "ክፍያ" : "Payment"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftRecords.map((shift) => {
                      const createdAt = new Date(shift.createdAt);
                      return (
                        <tr
                          key={shift.id}
                          className="hover:bg-primary/5 transition-colors"
                        >
                          <td className="border border-default-200 p-3 text-sm">
                            <span className="font-medium">
                              {shift.student.firstName}{" "}
                              {shift.student.fatherName}{" "}
                              {shift.student.lastName}
                            </span>
                          </td>
                          <td className="border border-default-200 p-3 text-sm">
                            {`${shift.teacher.firstName} ${shift.teacher.fatherName} ${shift.teacher.lastName}`}
                          </td>
                          <td className="border border-default-200 p-3 text-sm">
                            {shift.student.controller ? (
                              `${shift.student.controller.firstName} ${shift.student.controller.fatherName} ${shift.student.controller.lastName}`
                            ) : (
                              <span className="text-default-400">
                                {isAm ? "የለም" : "None"}
                              </span>
                            )}
                          </td>
                          <td className="border border-default-200 p-3 text-sm">
                            {createdAt.toLocaleDateString()}
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip color="success" size="sm" variant="flat">
                              {shift.learningCount}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip color="danger" size="sm" variant="flat">
                              {shift.missingCount}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip color="primary" size="sm" variant="flat">
                              {shift.totalCount}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip
                              size="sm"
                              color={
                                shift.paymentStatus === "approved"
                                  ? "success"
                                  : shift.paymentStatus === "pending"
                                  ? "warning"
                                  : "danger"
                              }
                              variant="dot"
                            >
                              {shift.paymentStatus === "approved"
                                ? isAm
                                  ? "ጸድቋል"
                                  : "Paid"
                                : shift.paymentStatus === "pending"
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
                  total={Math.max(1, totalPages)}
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
              <History className="size-20 text-default-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-default-600 mb-2">
                {isAm ? "የመምህር ለውጥ ታሪክ የለም" : "No shift history"}
              </h3>
              <p className="text-sm text-default-400">
                {isAm
                  ? "የፈለጋ እና ወር/ዓመት ማጣሪያዎችን ያስተካክሉ"
                  : "Adjust your search or month/year filters."}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
