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
  getTeacherMonthlyCalendar,
  getTeachersWithControllers,
} from "@/actions/manager/reporter";
import { Calendar, Search } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

export default function Page() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();

  // Get teachers with controllers
  const [teachersData, isLoadingTeachers] = useData(
    getTeachersWithControllers,
    () => {}
  );

  // Get calendar data when teacher is selected
  const [calendarData, isLoadingCalendar, refreshCalendar] = useData(
    getTeacherMonthlyCalendar,
    () => {},
    selectedTeacher || "",
    year,
    month
  );

  const filteredCalendarData = useMemo(() => {
    if (!calendarData?.success || !calendarData.data) return [];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return calendarData.data.calendarData;
    }
    return calendarData.data.calendarData.filter((item) => {
      const studentName =
        `${item.student.firstName} ${item.student.fatherName} ${item.student.lastName}`
          .toLowerCase()
          .trim();
      return studentName.includes(normalized);
    });
  }, [calendarData, searchTerm]);

  const daysInMonth = calendarData?.data?.daysInMonth ?? 0;
  const totalStudents = filteredCalendarData.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

  useEffect(() => {
    setPage(1);
  }, [selectedTeacher, month, year, searchTerm, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedCalendarData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCalendarData.slice(start, start + pageSize);
  }, [filteredCalendarData, page, pageSize]);

  const pageSizeOptions = useMemo(
    () => [10, 25, 50, 100].map((value) => value.toString()),
    []
  );

  const paginationInfo = useMemo(() => {
    if (totalStudents === 0) {
      return { start: 0, end: 0 };
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalStudents);
    return { start, end };
  }, [page, pageSize, totalStudents]);

  const monthOptions = useMemo(() => {
    const monthNames = isAm
      ? [
          { value: "1", label: "መስከረም" },
          { value: "2", label: "ጥቅምት" },
          { value: "3", label: "ህዳር" },
          { value: "4", label: "ታህሳስ" },
          { value: "5", label: "ጥር" },
          { value: "6", label: "የካቲት" },
          { value: "7", label: "መጋቢት" },
          { value: "8", label: "ሚያዝያ" },
          { value: "9", label: "ግንቦት" },
          { value: "10", label: "ሰኔ" },
          { value: "11", label: "ሐምሌ" },
          { value: "12", label: "ነሐሴ" },
        ]
      : [
          { value: "1", label: "January" },
          { value: "2", label: "February" },
          { value: "3", label: "March" },
          { value: "4", label: "April" },
          { value: "5", label: "May" },
          { value: "6", label: "June" },
          { value: "7", label: "July" },
          { value: "8", label: "August" },
          { value: "9", label: "September" },
          { value: "10", label: "October" },
          { value: "11", label: "November" },
          { value: "12", label: "December" },
        ];
    return monthNames;
  }, [isAm]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, idx) => currentYear - 3 + idx).map(
      (value) => ({
        value: value.toString(),
        label: value.toString(),
      })
    );
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 lg:p-6 gap-4">
      {/* Header with Teacher Selection */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
              <Calendar className="size-6 text-primary" />
              {isAm ? "የወር ሪፖርት አቀራረብ" : "Monthly Report View"}
            </h1>
            {/* <p className="text-sm text-default-500">
              {isAm
                ? "መምህሩን ይምረጡ እና የተመረጠውን ወር ሪፖርት በግልጽ እና ታላቅ ንድፍ ይመልከቱ።"
                : "Choose a teacher to explore their monthly learning progress in a clean, focused layout."}
            </p> */}
          </div>

          {/* Teacher Selection */}
          <div className="w-full lg:max-w-sm">
            <Autocomplete
              placeholder={isAm ? "መምህር ይፈልጉ..." : "Search for teacher..."}
              selectedKey={selectedTeacher || null}
              onSelectionChange={(key: React.Key | null) => {
                setSelectedTeacher((key as string) || "");
              }}
              defaultItems={teachersData?.data || []}
              variant="bordered"
              size="sm"
              isClearable
              isLoading={isLoadingTeachers}
              listboxProps={{
                emptyContent: isAm ? "ምንም መምህር አልተገኘም" : "No teachers found",
              }}
              classNames={{
                base: selectedTeacher
                  ? "border-2 border-success-300 dark:border-success-600 rounded-lg"
                  : "",
                listbox: "text-sm",
              }}
            >
              {(item: {
                teacher: {
                  id: string;
                  firstName: string;
                  fatherName: string;
                  lastName: string;
                };
                controller: {
                  firstName: string;
                  fatherName: string;
                  lastName: string;
                } | null;
              }) => (
                <AutocompleteItem
                  key={item.teacher.id}
                  textValue={`${item.teacher.firstName} ${item.teacher.fatherName} ${item.teacher.lastName}`}
                  className="py-1 text-sm"
                >
                  {item.teacher.firstName} {item.teacher.fatherName}{" "}
                  {item.teacher.lastName}
                </AutocompleteItem>
              )}
            </Autocomplete>
          </div>
        </CardBody>
      </Card>

      {/* Month/Year Navigation and Calendar */}
      {selectedTeacher && (
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
                classNames={{
                  inputWrapper:
                    "bg-white dark:bg-default-900/60 border border-default-200/60",
                }}
              />
              <Select
                aria-label="month"
                selectedKeys={new Set([month.toString()])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  if (value) setMonth(parseInt(value));
                }}
                variant="bordered"
                size="sm"
                className="w-[115px] flex-shrink"
              >
                {monthOptions.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
              <Select
                aria-label="year"
                selectedKeys={new Set([year.toString()])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  if (value) setYear(parseInt(value));
                }}
                variant="bordered"
                size="sm"
                className="w-[95px] flex-shrink"
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
                  if (value) setPageSize(parseInt(value));
                }}
                variant="bordered"
                size="sm"
                className="w-[110px] flex-shrink"
              >
                {pageSizeOptions.map((value) => (
                  <SelectItem key={value}>{value}</SelectItem>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardBody className="p-0 bg-default-50 dark:bg-default-950">
            {isLoadingCalendar ? (
              <div className="p-4">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>
            ) : calendarData?.success && calendarData.data ? (
              <div className="flex flex-col gap-3">
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                      <tr>
                        <th className="border border-default-200/70 p-2 text-left font-semibold min-w-[180px] sticky left-0 bg-default-100 dark:bg-default-900/80 z-20">
                          {isAm ? "ተማሪ" : "Student"}
                        </th>
                        {Array.from(
                          { length: daysInMonth },
                          (_, i) => i + 1
                        ).map((day) => (
                          <th
                            key={day}
                            className="border border-default-200/70 p-1 text-center font-semibold min-w-[50px] text-[11px] text-default-500"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCalendarData.length > 0 ? (
                        paginatedCalendarData.map((item, rowIndex) => {
                          const isEvenRow = rowIndex % 2 === 0;
                          const rowBgClass = isEvenRow
                            ? "bg-default-50 dark:bg-default-900/50"
                            : "bg-white dark:bg-default-950";
                          const stickyBgClass = isEvenRow
                            ? "bg-default-100 dark:bg-default-900/70"
                            : "bg-white dark:bg-default-950";

                          return (
                            <tr
                              key={item.student.id}
                              className={`${rowBgClass} hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors`}
                            >
                              <td
                                className={`border border-default-200/70 p-2 font-medium sticky left-0 z-10 text-default-700 dark:text-default-200 ${stickyBgClass}`}
                              >
                                <span className="text-sm font-semibold">
                                  {item.student.firstName}{" "}
                                  {item.student.fatherName}{" "}
                                  {item.student.lastName}
                                </span>
                              </td>
                              {Array.from(
                                { length: daysInMonth },
                                (_, i) => i + 1
                              ).map((day) => {
                                const report = item.reportsByDate[day];
                                return (
                                  <td
                                    key={day}
                                    className="border border-default-200/60 p-1 text-center align-middle"
                                  >
                                    {report ? (
                                      <div className="flex items-center justify-center">
                                        <Chip
                                          size="sm"
                                          radius="sm"
                                          color={
                                            report.learningProgress ===
                                            "present"
                                              ? "success"
                                              : report.learningProgress ===
                                                "permission"
                                              ? "primary"
                                              : "danger"
                                          }
                                          variant="flat"
                                          className="text-[10px] h-5 min-w-[46px] font-semibold bg-white/80 dark:bg-default-900/70"
                                        >
                                          {report.learningProgress === "present"
                                            ? isAm
                                              ? "ተገኝ"
                                              : "P"
                                            : report.learningProgress ===
                                              "permission"
                                            ? isAm
                                              ? "ፈቃድ"
                                              : "PE"
                                            : isAm
                                            ? "ጠፋ"
                                            : "A"}
                                        </Chip>
                                      </div>
                                    ) : (
                                      <span className="text-default-300 text-xs">
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={daysInMonth + 1 || 2}
                            className="border border-default-200 p-8 text-center text-default-500"
                          >
                            {searchTerm.trim().length > 0
                              ? isAm
                                ? "ተማሪ አልተገኘም። እባክዎ የፍለጋ ቃልን ይለውጡ።"
                                : "No students match your search. Try a different keyword."
                              : isAm
                              ? "ለዚህ መምህር ምንም ተማሪዎች አልተገኙም"
                              : "No students found for this teacher"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalStudents > 0 && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 pb-4">
                    <span className="text-xs text-default-500">
                      {isAm
                        ? `ውጤቶች ${paginationInfo.start}-${paginationInfo.end} ከ ${totalStudents} ጠቅላላ ተማሪዎች`
                        : `Showing ${paginationInfo.start}-${paginationInfo.end} of ${totalStudents} students`}
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
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-default-500">
                {isAm ? "መረጃ ማግኘት አልተሳካም" : "Failed to load data"}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Instructions when no teacher selected */}
      {!selectedTeacher && (
        <Card className="flex-1">
          <CardBody className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Calendar className="size-20 text-default-300 mx-auto" />
              <h3 className="text-xl font-semibold text-default-600">
                {isAm ? "መምህር ይምረጡ" : "Select a Teacher"}
              </h3>
              <p className="text-sm text-default-400 max-w-md">
                {isAm
                  ? "የወር ሪፖርት አቀራረብን ለማየት ከላይ ያለውን ተወላጅ መምህር ይምረጡ። ሪፖርቶች በቀን እና ተማሪ የተደራጁ ይታያሉ።"
                  : "Select a teacher from above to view their monthly report calendar. Reports will be organized by day and student."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

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
