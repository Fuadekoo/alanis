"use client";

import { useState, useMemo, useEffect } from "react";
import useData from "@/hooks/useData";
import {
  getAllTeachersForReporter,
  getTeacherDailyReportCalendar,
} from "@/actions/manager/reporter";
import {
  Skeleton,
  Card,
  CardBody,
  CardHeader,
  Autocomplete,
  AutocompleteItem,
  Input,
  Select,
  SelectItem,
  Pagination,
} from "@/components/ui/heroui";
import { Search, ClipboardList, Calendar } from "lucide-react";
import { Chip } from "@heroui/react";
import useAmharic from "@/hooks/useAmharic";

interface CalendarItem {
  student: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    username?: string;
  };
  reportsByDate: Record<
    number,
    {
      id: string;
      date: Date;
      learningProgress: string;
      approved: boolean | null;
    }
  >;
}

export default function Page() {
  const isAm = useAmharic();
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");

  // Get all teachers for search
  const [teachersData, isLoadingTeachers] = useData(
    getAllTeachersForReporter,
    () => {}
  );

  // Get teacherDailyReport calendar data
  const [calendarData, isLoadingCalendar] = useData(
    getTeacherDailyReportCalendar,
    () => {},
    selectedTeacherId || "",
    year,
    month
  );

  // Get selected teacher info
  const selectedTeacher = useMemo(() => {
    if (!teachersData?.data || !selectedTeacherId) return null;
    return (
      teachersData.data as Array<{
        id: string;
        firstName: string;
        fatherName: string;
        lastName: string;
        username?: string;
      }>
    ).find((teacher) => teacher.id === selectedTeacherId);
  }, [teachersData?.data, selectedTeacherId]);

  // Calendar data processing
  const filteredCalendarData = useMemo(() => {
    if (!calendarData?.success || !calendarData.data) return [];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return calendarData.data.calendarData;
    }
    return calendarData.data.calendarData.filter((item: CalendarItem) => {
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
  }, [selectedTeacherId, month, year, searchTerm, pageSize]);

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
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
                <Calendar className="size-6 text-primary" />
                {isAm ? "የመምህር ዕለታዊ ሪፖርት" : "Teacher Daily Report"}
              </h1>
              <p className="text-sm text-default-500 mt-1">
                {isAm
                  ? "መምህርን ይምረጡ እና የወር ሪፖርትን ይመልከቱ"
                  : "Select a teacher and view their monthly daily reports"}
              </p>
            </div>

            {/* Teacher Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Autocomplete
                label={isAm ? "መምህር ይምረጡ" : "Select Teacher"}
                placeholder={isAm ? "መምህርን ይፈልጉ..." : "Search for a teacher..."}
                selectedKey={selectedTeacherId}
                onSelectionChange={(key) => {
                  setSelectedTeacherId(key as string);
                  setPage(1);
                }}
                inputValue={""}
                onInputChange={() => {}}
                startContent={<Search className="size-4 text-default-400" />}
                className="flex-1"
                variant="bordered"
                isLoading={isLoadingTeachers}
                items={
                  (teachersData?.data as Array<{
                    id: string;
                    firstName: string;
                    fatherName: string;
                    lastName: string;
                    username?: string;
                  }>) || []
                }
              >
                {(teacher) => (
                  <AutocompleteItem
                    key={teacher.id}
                    textValue={`${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {teacher.firstName} {teacher.fatherName}{" "}
                        {teacher.lastName}
                      </span>
                      {teacher.username && (
                        <span className="text-xs text-default-400">
                          @{teacher.username}
                        </span>
                      )}
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>

            {/* Selected Teacher Info */}
            {selectedTeacher && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 border border-primary-200 dark:border-primary-800">
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {isAm ? "የተመረጠ መምህር" : "Selected Teacher"}:{" "}
                  <span className="font-semibold">
                    {selectedTeacher.firstName} {selectedTeacher.fatherName}{" "}
                    {selectedTeacher.lastName}
                  </span>
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Report Content */}
      {!selectedTeacherId ? (
        <Card className="flex-1">
          <CardBody className="flex items-center justify-center h-full">
            <div className="text-center">
              <ClipboardList className="size-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-default-600 mb-2">
                {isAm ? "መምህር ይምረጡ" : "Select a Teacher"}
              </h3>
              <p className="text-sm text-default-400 max-w-md">
                {isAm
                  ? "የመምህር ዕለታዊ ሪፖርትን ለመመልከት ከላይ ያለውን የፍለጋ ሳጥን በመጠቀም መምህርን ይምረጡ።"
                  : "Please select a teacher from the search box above to view their daily report calendar."}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="flex-1 overflow-hidden border border-default-200/70 shadow-sm">
          <CardHeader className="p-4 border-b border-default-200 bg-default-50 dark:bg-default-900/30 shrink-0">
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

          <CardBody className="p-0 bg-default-50 dark:bg-default-950 flex-1 min-h-0 overflow-hidden">
            {isLoadingCalendar ? (
              <div className="p-4">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>
            ) : calendarData?.success && calendarData.data ? (
              <div className="flex flex-col gap-3 h-full overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto w-full flex-1 min-h-0">
                  <table
                    className="border-collapse text-sm"
                    style={{
                      minWidth: `${180 + daysInMonth * 50}px`,
                    }}
                  >
                    <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                      <tr>
                        <th className="border border-default-200/70 p-2 text-left font-semibold w-[180px] min-w-[180px] sticky left-0 bg-default-100 dark:bg-default-900/80 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                          {isAm ? "ተማሪ" : "Student"}
                        </th>
                        {Array.from(
                          { length: daysInMonth },
                          (_, i) => i + 1
                        ).map((day) => (
                          <th
                            key={day}
                            className="border border-default-200/70 p-1 text-center font-semibold w-[50px] min-w-[50px] text-[11px] text-default-500"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCalendarData.length > 0 ? (
                        paginatedCalendarData.map(
                          (item: CalendarItem, rowIndex: number) => {
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
                                  className={`border border-default-200/70 p-2 font-medium sticky left-0 z-10 text-default-700 dark:text-default-200 w-[180px] min-w-[180px] ${stickyBgClass} shadow-[2px_0_4px_rgba(0,0,0,0.1)]`}
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
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          <Chip
                                            size="sm"
                                            radius="sm"
                                            color={
                                              report.approved === true
                                                ? "success"
                                                : report.approved === false
                                                ? "danger"
                                                : "default"
                                            }
                                            variant="flat"
                                            className="text-[10px] h-5 min-w-[46px] font-semibold bg-white/80 dark:bg-default-900/70"
                                          >
                                            {isAm ? "✓" : "R"}
                                          </Chip>
                                          {report.learningProgress && (
                                            <span
                                              className="text-[9px] text-default-400 truncate max-w-[50px]"
                                              title={report.learningProgress}
                                            >
                                              {report.learningProgress.substring(
                                                0,
                                                10
                                              )}
                                              {report.learningProgress.length >
                                              10
                                                ? "..."
                                                : ""}
                                            </span>
                                          )}
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
                          }
                        )
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
                              ? "ለዚህ መምህር ምንም የመምህር ዕለታዊ ሪፖርቶች አልተገኙም"
                              : "No teacher daily reports found for this teacher"}
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
    </div>
  );
}
