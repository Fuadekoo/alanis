"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Pagination,
  Skeleton,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/heroui";
import { Calendar, CheckCircle2, Search } from "lucide-react";
import useData from "@/hooks/useData";
import useMutation from "@/hooks/useMutation";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";
import {
  getStudentDailyCalendar,
  studentApproveReport,
} from "@/actions/student/report";

interface CalendarReport {
  id: string;
  date: string | Date;
  learningProgress: "present" | "absent" | "permission" | null;
  learningSlot: string | null;
  studentApproved: boolean | null;
  teacherApproved: boolean | null;
}

interface CalendarTeacherRow {
  teacher: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    username: string | null;
  };
  reportsByDate: Record<number, CalendarReport | undefined>;
}

type SelectedReport = {
  id: string;
  teacherName: string;
  date: Date;
  learningProgress: "present" | "absent" | "permission" | null;
  learningSlot: string | null;
  studentApproved: boolean | null;
  teacherApproved: boolean | null;
};

function formatProgressLabel(
  value: "present" | "absent" | "permission" | null,
  isAm: boolean
) {
  if (value === "present") {
    return isAm ? "ተገኝ" : "Present";
  }
  if (value === "permission") {
    return isAm ? "ፈቃድ" : "Permission";
  }
  if (value === "absent") {
    return isAm ? "ጠፋ" : "Absent";
  }
  return isAm ? "የለም" : "N/A";
}

function getProgressColor(value: "present" | "absent" | "permission" | null) {
  if (value === "present") return "success" as const;
  if (value === "permission") return "primary" as const;
  return "danger" as const;
}

export default function Page() {
  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedReport, setSelectedReport] = useState<SelectedReport | null>(
    null
  );
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  const [calendarResponse, isLoadingCalendar, refreshCalendar] = useData(
    getStudentDailyCalendar,
    () => {},
    year,
    month
  );

  const rawCalendarData = useMemo((): CalendarTeacherRow[] => {
    const data = calendarResponse?.data?.calendarData || [];
    return data as CalendarTeacherRow[];
  }, [calendarResponse?.data?.calendarData]);

  const daysInMonth = calendarResponse?.data?.daysInMonth ?? 0;

  const filteredCalendarData = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return rawCalendarData;
    }
    return rawCalendarData.filter((item) => {
      const teacherName =
        `${item.teacher.firstName} ${item.teacher.fatherName} ${item.teacher.lastName}`
          .toLowerCase()
          .trim();
      return teacherName.includes(normalized);
    });
  }, [rawCalendarData, searchTerm]);

  const totalTeachers = filteredCalendarData.length;
  const totalPages = Math.max(1, Math.ceil(totalTeachers / pageSize));

  useEffect(() => {
    setPage(1);
  }, [month, year, searchTerm, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCalendarData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCalendarData.slice(start, start + pageSize);
  }, [filteredCalendarData, page, pageSize]);

  const pageSizeOptions = useMemo(
    () => [10, 25, 50, 100].map((value) => value.toString()),
    []
  );

  const monthOptions = useMemo(() => {
    const monthNames = isAm
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

    return monthNames.map((label, index) => ({
      value: (index + 1).toString(),
      label: `${index + 1} • ${label}`,
    }));
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

  const paginationInfo = useMemo(() => {
    if (totalTeachers === 0) return { start: 0, end: 0 };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalTeachers);
    return { start, end };
  }, [page, pageSize, totalTeachers]);

  const [approveReport, isApproving] = useMutation(
    studentApproveReport,
    (result) => {
      if (result?.success) {
        showAlert({
          message: isAm ? "ሪፖርቱ በተሳካ ሁኔታ ጸድቋል" : "Report approved successfully",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
        setIsApproveModalOpen(false);
        setSelectedReport(null);
        refreshCalendar?.();
      } else {
        showAlert({
          message:
            result?.error ||
            (isAm ? "ሪፖርት ማረጋገጥ አልተቻለም" : "Failed to approve report"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    }
  );

  const openApproveModal = (teacherName: string, report: CalendarReport) => {
    setSelectedReport({
      id: report.id,
      teacherName,
      date: new Date(report.date),
      learningProgress: report.learningProgress,
      learningSlot: report.learningSlot,
      studentApproved: report.studentApproved,
      teacherApproved: report.teacherApproved,
    });
    setIsApproveModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedReport || selectedReport.studentApproved) return;
    approveReport(selectedReport.id, true);
  };

  const closeApproveModal = () => {
    if (isApproving) return;
    setIsApproveModalOpen(false);
    setSelectedReport(null);
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
                {isAm ? "የቀን ሪፖርቶቼ" : "My Daily Reports"}
              </h1>
              <p className="text-sm text-default-500">
                {isAm
                  ? "የመምህሮቼን ሪፖርቶች ይመልከቱ እና ያጽዱ"
                  : "Review each teacher's report and confirm your attendance."}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <div className="flex flex-col gap-2 flex-1 lg:flex-row lg:items-end lg:gap-2">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={isAm ? "መምህር ፈልግ..." : "Search for a teacher..."}
                variant="bordered"
                size="sm"
                startContent={<Search className="size-4 text-default-400" />}
                className="w-full lg:max-w-md"
                classNames={{
                  inputWrapper:
                    "bg-white dark:bg-default-900/60 border border-default-200/60",
                }}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  aria-label="month"
                  selectedKeys={new Set([month.toString()])}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    if (value) setMonth(parseInt(value, 10));
                  }}
                  variant="bordered"
                  size="sm"
                  className="sm:w-[180px]"
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
                    if (value) setYear(parseInt(value, 10));
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
                  className="sm:w-[140px]"
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
          {isLoadingCalendar ? (
            <div className="p-4">
              <Skeleton className="w-full h-96 rounded-lg" />
            </div>
          ) : calendarResponse?.success ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                    <tr>
                      <th className="border border-default-200/70 p-2 text-left font-semibold min-w-[190px] sticky left-0 bg-default-100 dark:bg-default-900/80 z-20">
                        {isAm ? "መምህር" : "Teacher"}
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                        (day) => (
                          <th
                            key={day}
                            className="border border-default-200/70 p-1 text-center font-semibold min-w-[60px] text-[11px] text-default-500"
                          >
                            {day}
                          </th>
                        )
                      )}
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

                        const teacherName = `${item.teacher.firstName} ${item.teacher.fatherName} ${item.teacher.lastName}`;

                        return (
                          <tr
                            key={item.teacher.id}
                            className={`${rowBgClass} hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors`}
                          >
                            <td
                              className={`border border-default-200/70 p-2 font-medium sticky left-0 z-10 text-default-700 dark:text-default-200 ${stickyBgClass}`}
                            >
                              <span className="text-sm font-semibold">
                                {teacherName}
                              </span>
                            </td>
                            {Array.from(
                              { length: daysInMonth },
                              (_, i) => i + 1
                            ).map((day) => {
                              const report = item.reportsByDate[day];

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

                              const progressLabel = formatProgressLabel(
                                report.learningProgress,
                                isAm
                              );
                              const progressColor = getProgressColor(
                                report.learningProgress
                              );

                              return (
                                <td
                                  key={day}
                                  className="border border-default-200/60 p-1 text-center align-middle"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openApproveModal(teacherName, report)
                                    }
                                    className={`w-full rounded-md border px-1 py-1 flex flex-col items-center gap-1 transition ${
                                      report.studentApproved
                                        ? "border-success-300 bg-success-50/60 dark:bg-success-500/10"
                                        : "border-default-200/60 bg-white dark:bg-default-900/50 hover:border-primary-300 hover:bg-primary-50/40 dark:hover:bg-primary-500/20"
                                    }`}
                                  >
                                    <Chip
                                      size="sm"
                                      radius="sm"
                                      color={progressColor}
                                      variant="flat"
                                      className="text-[10px] h-5 min-w-[52px] font-semibold bg-white/80 dark:bg-default-900/80"
                                    >
                                      {progressLabel}
                                    </Chip>
                                    {report.studentApproved ? (
                                      <span className="flex items-center gap-1 text-[10px] font-medium text-success-600 dark:text-success-300">
                                        <CheckCircle2 className="size-3" />
                                        {isAm ? "ተፈጸመ" : "Approved"}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-default-400">
                                        {isAm ? "አረጋግጥ" : "Approve"}
                                      </span>
                                    )}
                                  </button>
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
                              ? "መምህር አልተገኘም። የፍለጋ ቃልን ይለውጡ።"
                              : "No teachers match your search. Try a different keyword."
                            : isAm
                            ? "ለዚህ ወር ሪፖርት የለም።"
                            : "No daily reports for this month."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalTeachers > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 pb-4">
                  <span className="text-xs text-default-500">
                    {isAm
                      ? `ውጤቶች ${paginationInfo.start}-${paginationInfo.end} ከ ${totalTeachers} ጠቅላላ መምህሮች`
                      : `Showing ${paginationInfo.start}-${paginationInfo.end} of ${totalTeachers} teachers`}
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
              {isAm ? "መረጃ ማግኘት አልተሳካም" : "Failed to load daily reports."}
            </div>
          )}
        </CardBody>
      </Card>

      {selectedReport && (
        <Modal
          isOpen={isApproveModalOpen}
          onClose={closeApproveModal}
          size="md"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold">
                {isAm ? "ሪፖርት ያረጋግጡ" : "Approve Report"}
              </h3>
              <p className="text-sm text-default-500">
                {selectedReport.teacherName} •{" "}
                {selectedReport.date.toLocaleDateString()}
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "የትምህርት ሁኔታ" : "Learning status"}
                    </span>
                    <span className="font-semibold text-default-900">
                      {formatProgressLabel(
                        selectedReport.learningProgress,
                        isAm
                      )}
                    </span>
                  </div>
                  {selectedReport.learningSlot && (
                    <div className="flex justify-between">
                      <span className="text-default-500">
                        {isAm ? "ትምህርት ሰዓት" : "Learning slot"}
                      </span>
                      <span className="font-semibold text-default-900">
                        {selectedReport.learningSlot}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "መምህር ማረጋገጫ" : "Teacher approval"}
                    </span>
                    <span
                      className={`font-semibold ${
                        selectedReport.teacherApproved
                          ? "text-success-600"
                          : "text-default-600"
                      }`}
                    >
                      {selectedReport.teacherApproved
                        ? isAm
                          ? "ተፈጸመ"
                          : "Approved"
                        : isAm
                        ? "በመጠባበቅ"
                        : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">
                      {isAm ? "ተማሪ ማረጋገጫ" : "Your approval"}
                    </span>
                    <span className="font-semibold text-default-900">
                      {selectedReport.studentApproved
                        ? isAm
                          ? "ተፈጸመ"
                          : "Approved"
                        : isAm
                        ? "በመጠባበቅ"
                        : "Pending"}
                    </span>
                  </div>
                </div>

                {!selectedReport.studentApproved && (
                  <div className="rounded-lg border border-warning-200 bg-warning-50/70 px-3 py-2 text-xs text-warning-700">
                    {isAm
                      ? "ይህ ሪፖርት ትክክለኛ መሆኑን ከማረጋገጥዎ በኋላ በመዝገቡ ይጠበቃል።"
                      : "Once you confirm, this report will be marked as acknowledged."}
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={closeApproveModal}
                isDisabled={isApproving}
              >
                {isAm ? "ዝጋ" : "Cancel"}
              </Button>
              <Button
                color="primary"
                onPress={handleApprove}
                isDisabled={selectedReport.studentApproved || isApproving}
                isLoading={isApproving}
              >
                {selectedReport.studentApproved
                  ? isAm
                    ? "ተፈጸመ"
                    : "Approved"
                  : isAm
                  ? "አረጋግጥ"
                  : "Approve"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <CustomAlert
        isOpen={isAlertOpen}
        onClose={closeAlert}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
      />
    </div>
  );
}
