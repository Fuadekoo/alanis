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
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
} from "@/components/ui/heroui";
import {
  getTeacherDateRangeReportSummary,
  getTeachersWithControllers,
  getTeacherMonthlyCalendar,
} from "@/actions/manager/reporter";
import { deleteReport } from "@/actions/controller/report";
import { Calendar, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

interface CalendarReport {
  id: string;
  studentId: string;
  date: string | Date;
  learningProgress: "present" | "absent" | "permission" | null;
  learningSlot: string | null;
  studentApproved: boolean | null;
  teacherApproved: boolean | null;
}

interface DateRangeStudentSummary {
  student: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  };
  totalReports: number;
  presentCount: number;
  permissionCount: number;
  absentCount: number;
  presentPercentage: number;
  permissionPercentage: number;
  absentPercentage: number;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("monthly");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [appliedRangeStartDate, setAppliedRangeStartDate] = useState("");
  const [appliedRangeEndDate, setAppliedRangeEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    studentName: string;
    date: string;
    learningSlot?: string | null;
    learningProgress?: string | null;
  } | null>(null);

  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();

  const [teachersData, isLoadingTeachers] = useData(
    getTeachersWithControllers,
    () => {}
  );

  const [calendarData, isLoadingCalendar, refreshCalendar] = useData(
    getTeacherMonthlyCalendar,
    () => {},
    selectedTeacher || "",
    year,
    month,
    statusFilter
  );
  const [dateRangeReportData, isLoadingDateRangeReport] = useData(
    getTeacherDateRangeReportSummary,
    () => {},
    selectedTeacher || "",
    appliedRangeStartDate,
    appliedRangeEndDate
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
  }, [selectedTeacher, month, year, searchTerm, pageSize, statusFilter]);

  useEffect(() => {
    setRangeStartDate("");
    setRangeEndDate("");
    setAppliedRangeStartDate("");
    setAppliedRangeEndDate("");
    setActiveTab("monthly");
  }, [selectedTeacher]);

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

  const statusOptions = useMemo(() => {
    return [
      { value: "all", label: isAm ? "ሁሉም" : "All" },
      { value: "new", label: isAm ? "አዲስ" : "New" },
      { value: "active", label: isAm ? "ተንቀሳቃሽ" : "Active" },
      { value: "inactive", label: isAm ? "ያልነቃ" : "Inactive" },
      { value: "onProgress", label: isAm ? "በሂደት ላይ" : "On Progress" },
      { value: "remedanLeft", label: isAm ? "ረመዳን ያለፈ" : "Remedan Left" },
    ];
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

  const currentTeacher = useMemo(() => {
    if (!teachersData?.data || !selectedTeacher) return null;
    return teachersData.data.find(
      (item: { teacher: { id: string } }) => item.teacher.id === selectedTeacher
    )?.teacher;
  }, [teachersData, selectedTeacher]);

  const isDateRangeReady = Boolean(rangeStartDate && rangeEndDate);
  const isDateRangeInvalid =
    isDateRangeReady && rangeStartDate > rangeEndDate;
  const hasAppliedDateRange = Boolean(
    appliedRangeStartDate && appliedRangeEndDate
  );
  const dateRangeSummary = dateRangeReportData?.success
    ? dateRangeReportData.data?.summary
    : null;
  const dateRangeStudentSummaries = dateRangeReportData?.success
    ? ((dateRangeReportData.data?.studentSummaries as DateRangeStudentSummary[]) ??
      [])
    : [];

  const handleApplyDateRange = () => {
    if (!isDateRangeReady || isDateRangeInvalid) return;
    setAppliedRangeStartDate(rangeStartDate);
    setAppliedRangeEndDate(rangeEndDate);
  };

  const handleDeleteClick = (
    student: { firstName: string; fatherName: string; lastName: string },
    report: CalendarReport
  ) => {
    setReportToDelete({
      id: report.id,
      studentName: `${student.firstName} ${student.fatherName} ${student.lastName}`,
      date: new Date(report.date).toLocaleDateString(),
      learningSlot: report.learningSlot,
      learningProgress: report.learningProgress,
    });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteReport(reportToDelete.id);
      if (result.success) {
        showAlert({
          message: isAm
            ? "ሪፖርት በተሳካ ሁኔታ ተሰርዟል!"
            : "Report deleted successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
        setIsDeleteModalOpen(false);
        setReportToDelete(null);
        if (refreshCalendar) {
          refreshCalendar();
        }
      } else {
        showAlert({
          message:
            result.error ||
            (isAm ? "ሪፖርት መሰረዝ አልተሳካም" : "Failed to delete report"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch (error) {
      console.error("Failed to delete report", error);
      showAlert({
        message: isAm ? "ሪፖርት መሰረዝ አልተሳካም" : "Failed to delete report",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 lg:p-6 gap-4">
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
              <Calendar className="size-6 text-primary" />
              {isAm ? "የወር ሪፖርት አቀራረብ" : "Monthly Report View"}
            </h1>
            {currentTeacher && (
              <p className="text-xs text-default-500">
                {isAm ? "መምህር:" : "Teacher:"}{" "}
                {`${currentTeacher.firstName} ${currentTeacher.fatherName} ${currentTeacher.lastName}`}
              </p>
            )}
          </div>

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

      {selectedTeacher && (
        <>
          <Card className="border border-default-200/70 shadow-sm">
            <CardBody className="p-3">
              <Tabs
                aria-label="Daily report view tabs"
                selectedKey={activeTab}
                onSelectionChange={(key: React.Key) =>
                  setActiveTab(key as string)
                }
                variant="light"
                color="primary"
                classNames={{
                  tabList:
                    "gap-2 w-fit rounded-2xl border border-default-200 bg-default-50 dark:bg-default-900/60 p-2",
                  cursor:
                    "rounded-xl bg-white dark:bg-default-800 shadow-sm border border-default-200 dark:border-default-700",
                  tab: "px-5 h-11",
                  tabContent:
                    "text-default-500 group-data-[selected=true]:text-default-900 font-semibold",
                }}
              >
                <Tab key="monthly" title="Monthly View" />
                <Tab key="filter" title="Filter Report" />
              </Tabs>
            </CardBody>
          </Card>

          {activeTab === "monthly" && (
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
                aria-label="status"
                selectedKeys={new Set([statusFilter])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  if (value) setStatusFilter(value);
                }}
                variant="bordered"
                size="sm"
                className="w-[130px] flex-shrink"
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
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
                                const report = item.reportsByDate[day] as
                                  | CalendarReport
                                  | undefined;
                                if (!report) {
                                  return (
                                    <td
                                      key={day}
                                      className="border border-default-200/60 p-1 text-center align-middle"
                                    >
                                      <span className="text-default-300 text-xs">
                                        —
                                      </span>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={day}
                                    className="border border-default-200/60 p-1 text-center align-middle"
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <Chip
                                        size="sm"
                                        radius="sm"
                                        color={
                                          report.learningProgress === "present"
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
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        className="min-w-unit-6 w-6 h-6"
                                        onPress={() =>
                                          handleDeleteClick(
                                            item.student,
                                            report
                                          )
                                        }
                                      >
                                        <Trash2 className="size-3" />
                                      </Button>
                                    </div>
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

          {activeTab === "filter" && (
            <Card className="flex-1 overflow-hidden border border-default-200/70 shadow-sm">
              <CardHeader className="border-b border-default-200 bg-default-50 dark:bg-default-900/30 p-4">
                <div className="flex w-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <SlidersHorizontal className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-default-900">
                        {isAm ? "á‰€áŠ• àˆà¤?à¤? àˆªá–áˆ­à‰µ áˆ›à¤¤à¥‹à¤¯" : "Date Range Report Filter"}
                      </h2>
                      <p className="text-sm text-default-500">
                        {isAm
                          ? "áˆ˜àŒ¨à¨“à¤? à‰€à¤? áŠ¥à¤?à¤¨ áˆ˜àŒ¨à¤? á‰€à¤? áˆ˜àˆ¨àŒ¡ àŠ¨á‰°àˆ˜à¨¨à¨ªà¤? àŒŠà¤? à‹¨á‰°áˆàŒ à¤? daily reports à‹­à‰†à¤? áŠ¥à¤?à¤¨ present, permission, absent àˆ˜àŒ àŠ• à‹­à¨‡."
                          : "Select a start and end date to count reports in that range and display present, permission, and absent results."}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto_auto]">
                    <Input
                      type="date"
                      label={isAm ? "Start Date" : "Start Date"}
                      value={rangeStartDate}
                      onChange={(event) => setRangeStartDate(event.target.value)}
                      variant="bordered"
                    />
                    <Input
                      type="date"
                      label={isAm ? "End Date" : "End Date"}
                      value={rangeEndDate}
                      onChange={(event) => setRangeEndDate(event.target.value)}
                      variant="bordered"
                    />
                    <Button
                      color="primary"
                      onPress={handleApplyDateRange}
                      isDisabled={!isDateRangeReady || isDateRangeInvalid}
                      className="h-12 self-end"
                    >
                      {isAm ? "Apply" : "Apply Filter"}
                    </Button>
                    <Button
                      variant="flat"
                      onPress={() => {
                        setRangeStartDate("");
                        setRangeEndDate("");
                        setAppliedRangeStartDate("");
                        setAppliedRangeEndDate("");
                      }}
                      isDisabled={
                        !rangeStartDate &&
                        !rangeEndDate &&
                        !appliedRangeStartDate &&
                        !appliedRangeEndDate
                      }
                      className="h-12 self-end"
                    >
                      {isAm ? "Reset" : "Reset"}
                    </Button>
                  </div>
                  {isDateRangeInvalid && (
                    <p className="text-sm font-medium text-danger">
                      {isAm
                        ? "Start date must be on or before end date."
                        : "Start date must be on or before end date."}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardBody className="bg-default-50 dark:bg-default-950 p-4">
                {!hasAppliedDateRange ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-default-300 bg-white/70 p-8 text-center dark:bg-default-900/40">
                    <div className="max-w-md space-y-3">
                      <Calendar className="mx-auto size-14 text-default-300" />
                      <h3 className="text-lg font-semibold text-default-700">
                        {isAm ? "Choose a Date Range" : "Choose a Date Range"}
                      </h3>
                      <p className="text-sm text-default-500">
                        {isAm
                          ? "Select a start and end date, then apply the filter to summarize the selected daily reports."
                          : "Select a start and end date, then apply the filter to summarize the selected daily reports."}
                      </p>
                    </div>
                  </div>
                ) : isLoadingDateRangeReport ? (
                  <Skeleton className="h-[420px] w-full rounded-2xl" />
                ) : dateRangeReportData?.success && dateRangeSummary ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 rounded-2xl border border-default-200 bg-white p-4 text-sm text-default-500 dark:bg-default-900/50 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        Selected Range:{" "}
                        <span className="font-semibold text-default-800 dark:text-default-100">
                          {appliedRangeStartDate} - {appliedRangeEndDate}
                        </span>
                      </span>
                      <span>
                        Teacher:{" "}
                        <span className="font-semibold text-default-800 dark:text-default-100">
                          {currentTeacher
                            ? `${currentTeacher.firstName} ${currentTeacher.fatherName} ${currentTeacher.lastName}`
                            : "-"}
                        </span>
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Card className="border border-default-200/70 shadow-sm">
                        <CardBody className="gap-1 p-5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-default-500">
                            Total Reports
                          </span>
                          <span className="text-3xl font-bold text-default-900 dark:text-default-100">
                            {dateRangeSummary.totalReports}
                          </span>
                          <span className="text-xs text-default-500">
                            {dateRangeSummary.totalStudents} students in range
                          </span>
                        </CardBody>
                      </Card>
                      <Card className="border border-success-200/80 bg-success-50/60 shadow-sm dark:border-success-800/60 dark:bg-success-900/10">
                        <CardBody className="gap-1 p-5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-success-700 dark:text-success-300">
                            Present
                          </span>
                          <span className="text-3xl font-bold text-success-700 dark:text-success-300">
                            {dateRangeSummary.presentCount}
                          </span>
                          <span className="text-xs text-success-700/80 dark:text-success-300/80">
                            {dateRangeSummary.presentPercentage}% of selected reports
                          </span>
                        </CardBody>
                      </Card>
                      <Card className="border border-primary-200/80 bg-primary-50/60 shadow-sm dark:border-primary-800/60 dark:bg-primary-900/10">
                        <CardBody className="gap-1 p-5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                            Permission
                          </span>
                          <span className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                            {dateRangeSummary.permissionCount}
                          </span>
                          <span className="text-xs text-primary-700/80 dark:text-primary-300/80">
                            {dateRangeSummary.permissionPercentage}% of selected reports
                          </span>
                        </CardBody>
                      </Card>
                      <Card className="border border-danger-200/80 bg-danger-50/60 shadow-sm dark:border-danger-800/60 dark:bg-danger-900/10">
                        <CardBody className="gap-1 p-5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-danger-700 dark:text-danger-300">
                            Absent
                          </span>
                          <span className="text-3xl font-bold text-danger-700 dark:text-danger-300">
                            {dateRangeSummary.absentCount}
                          </span>
                          <span className="text-xs text-danger-700/80 dark:text-danger-300/80">
                            {dateRangeSummary.absentPercentage}% of selected reports
                          </span>
                        </CardBody>
                      </Card>
                    </div>

                    <Card className="border border-default-200/70 shadow-sm">
                      <CardHeader className="border-b border-default-200 bg-default-50 px-4 py-3 dark:bg-default-900/40">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-default-900 dark:text-default-100">
                            Student Summary Table
                          </h3>
                          <p className="text-xs text-default-500">
                            Counts for each student within the selected date range.
                          </p>
                        </div>
                      </CardHeader>
                      <CardBody className="p-0">
                        {dateRangeStudentSummaries.length > 0 ? (
                          <div className="overflow-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                                <tr>
                                  <th className="border border-default-200/70 p-3 text-left font-semibold min-w-[220px]">
                                    Student
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[110px]">
                                    Total
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[120px]">
                                    Present
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[130px]">
                                    Permission
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[110px]">
                                    Absent
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[110px]">
                                    Present %
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[130px]">
                                    Permission %
                                  </th>
                                  <th className="border border-default-200/70 p-3 text-center font-semibold min-w-[110px]">
                                    Absent %
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {dateRangeStudentSummaries.map((item, index) => (
                                  <tr
                                    key={item.student.id}
                                    className={
                                      index % 2 === 0
                                        ? "bg-white dark:bg-default-950"
                                        : "bg-default-50 dark:bg-default-900/40"
                                    }
                                  >
                                    <td className="border border-default-200/70 p-3 font-medium text-default-800 dark:text-default-100">
                                      {item.student.firstName}{" "}
                                      {item.student.fatherName}{" "}
                                      {item.student.lastName}
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center">
                                      <Chip size="sm" variant="flat">
                                        {item.totalReports}
                                      </Chip>
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center">
                                      <span className="inline-flex min-w-[86px] justify-center rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-900/20 dark:text-success-300">
                                        {item.presentCount}
                                      </span>
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center">
                                      <span className="inline-flex min-w-[86px] justify-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                                        {item.permissionCount}
                                      </span>
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center">
                                      <span className="inline-flex min-w-[86px] justify-center rounded-full bg-danger-50 px-2.5 py-1 text-xs font-semibold text-danger-700 dark:bg-danger-900/20 dark:text-danger-300">
                                        {item.absentCount}
                                      </span>
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center font-semibold text-default-700 dark:text-default-200">
                                      {item.presentPercentage}%
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center font-semibold text-default-700 dark:text-default-200">
                                      {item.permissionPercentage}%
                                    </td>
                                    <td className="border border-default-200/70 p-3 text-center font-semibold text-default-700 dark:text-default-200">
                                      {item.absentPercentage}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-default-500">
                            No reports found in the selected date range.
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                ) : (
                  <div className="p-8 text-center text-default-500">
                    {dateRangeReportData?.error || "Failed to load filtered report data"}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

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
                  ? "የወር ሪፖርት አቀራረብን ለማየት ከላይ ያለውን መምህር ይምረጡ።"
                  : "Choose a teacher above to review their monthly calendar of daily reports."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setReportToDelete(null);
          }
        }}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 text-danger">
            <Trash2 className="size-5" />
            <span>{isAm ? "ሪፖርት ይሰረዝ?" : "Delete Report?"}</span>
          </ModalHeader>
          <ModalBody>
            {reportToDelete ? (
              <div className="space-y-3 text-sm text-default-600">
                <p>
                  {isAm
                    ? "ይህን ሪፖርት መሰረዝ እርግጠኛ ነዎት? ይህ ተግባር መመለስ አይቻልም።"
                    : "Are you sure you want to delete this report? This action cannot be undone."}
                </p>
                <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 space-y-1">
                  <div>
                    <span className="font-semibold text-danger-600 dark:text-danger-300">
                      {isAm ? "ተማሪ:" : "Student:"}
                    </span>{" "}
                    {reportToDelete.studentName}
                  </div>
                  <div>
                    <span className="font-semibold text-danger-600 dark:text-danger-300">
                      {isAm ? "ቀን:" : "Date:"}
                    </span>{" "}
                    {reportToDelete.date}
                  </div>
                  {reportToDelete.learningSlot && (
                    <div>
                      <span className="font-semibold text-danger-600 dark:text-danger-300">
                        {isAm ? "ሰዓት:" : "Slot:"}
                      </span>{" "}
                      {reportToDelete.learningSlot}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsDeleteModalOpen(false);
                setReportToDelete(null);
              }}
              isDisabled={isDeleting}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              {isAm ? "ሰርዝ" : "Delete"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
