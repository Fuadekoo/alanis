"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  DatePicker,
} from "@/components/ui/heroui";
import {
  getTeacherMonthlyCalendar,
  getTeachersWithControllers,
} from "@/actions/manager/reporter";
import {
  getStudentsForReport,
  createReport,
  deleteReport,
} from "@/actions/controller/report";
import { Calendar, Search, Plus, Trash2 } from "lucide-react";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
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
}

export default function Page() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTeacher, setModalTeacher] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [learningSlot, setLearningSlot] = useState("");
  const [learningProgress, setLearningProgress] = useState<
    "present" | "absent" | "permission" | ""
  >("");
  const [reportDate, setReportDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [weekendOnly, setWeekendOnly] = useState(false);

  // Delete modal state
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

  const timeZone = useMemo(() => getLocalTimeZone(), []);
  const todayValue = useMemo(
    () => parseDate(new Date().toISOString().split("T")[0]),
    []
  );
  const datePickerValue = useMemo(
    () => (reportDate ? parseDate(reportDate) : undefined),
    [reportDate]
  );

  const [teachersData, isLoadingTeachers] = useData(
    getTeachersWithControllers,
    () => {}
  );

  const [studentsData, isLoadingStudents] = useData(
    getStudentsForReport,
    () => {},
    modalTeacher || selectedTeacher || ""
  );

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
    if (!normalized) return calendarData.data.calendarData;
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
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!isModalOpen) {
      setModalTeacher(selectedTeacher);
    }
  }, [selectedTeacher, isModalOpen]);

  const paginatedCalendarData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCalendarData.slice(start, start + pageSize);
  }, [filteredCalendarData, page, pageSize]);

  const pageSizeOptions = useMemo(
    () => [10, 25, 50, 100].map((value) => value.toString()),
    []
  );

  const paginationInfo = useMemo(() => {
    if (totalStudents === 0) return { start: 0, end: 0 };
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

  const currentTeacher = useMemo(() => {
    if (!teachersData?.data || !selectedTeacher) return null;
    return teachersData.data.find(
      (item: { teacher: { id: string } }) => item.teacher.id === selectedTeacher
    )?.teacher;
  }, [teachersData, selectedTeacher]);

  const resetModalForm = () => {
    setModalTeacher(selectedTeacher);
    setSelectedStudent("");
    setLearningSlot("");
    setLearningProgress("");
    setReportDate("");
    setWeekendOnly(false);
  };

  const openCreateModal = () => {
    resetModalForm();
    setIsModalOpen(true);
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
      learningProgress: report.learningProgress ?? undefined,
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
        if (refreshCalendar) refreshCalendar();
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

  const handleCreateReport = async () => {
    if (!modalTeacher || !selectedStudent || !reportDate || !learningProgress) {
      showAlert({
        message: isAm
          ? "እባክዎ ሁሉንም መስኮች ይሙሉ"
          : "Please fill in all required fields",
        type: "warning",
        title: isAm ? "ማስጠንቀቂያ" : "Warning",
      });
      return;
    }

    if (!learningSlot) {
      showAlert({
        message: isAm
          ? "የትምህርት ሰዓት አልተገኘም። እባክዎ ለዚህ መምህር እና ተማሪ የክፍል ምደባ እንዳለ ያረጋግጡ"
          : "Learning time not found. Please ensure this teacher and student have a room assignment.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(reportDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    if (selectedDateObj > today) {
      showAlert({
        message: isAm
          ? "ለወደፊት ቀናት ሪፖርት መፍጠር አይችሉም"
          : "You cannot create reports for future dates.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    // Simple duplicate check within current calendar view
    if (
      modalTeacher === selectedTeacher &&
      selectedDateObj.getFullYear() === year &&
      selectedDateObj.getMonth() + 1 === month
    ) {
      const day = selectedDateObj.getDate();
      const duplicate = calendarData?.data?.calendarData?.find(
        (item) => item.student.id === selectedStudent
      )?.reportsByDate?.[day];
      if (duplicate) {
        showAlert({
          message: isAm
            ? "ለዚህ ቀን ሪፖርት አስቀድሞ አለ።"
            : "A report already exists for this date.",
          type: "warning",
          title: isAm ? "ዳግም ሪፖርት" : "Duplicate Report",
        });
        return;
      }
    }

    setIsCreating(true);
    try {
      const result = await createReport({
        studentId: selectedStudent,
        activeTeacherId: modalTeacher,
        learningSlot,
        learningProgress,
        date: selectedDateObj,
      });

      if (result.success) {
        showAlert({
          message: isAm
            ? "ሪፖርት በተሳካ ሁኔታ ተፈጥሯል!"
            : "Report created successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
        setIsModalOpen(false);
        const newMonth = selectedDateObj.getMonth() + 1;
        const newYear = selectedDateObj.getFullYear();
        setMonth(newMonth);
        setYear(newYear);
        if (modalTeacher !== selectedTeacher) {
          setSelectedTeacher(modalTeacher);
        }
        resetModalForm();
        if (refreshCalendar) refreshCalendar();
      } else {
        showAlert({
          message:
            result.error ||
            (isAm ? "ሪፖርት መፍጠር አልተሳካም" : "Failed to create report"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch (error) {
      console.error("Failed to create report", error);
      showAlert({
        message: isAm ? "ሪፖርት መፍጠር አልተሳካም" : "Failed to create report",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    } finally {
      setIsCreating(false);
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

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button
              color="primary"
              startContent={<Plus className="size-4" />}
              onPress={openCreateModal}
            >
              {isAm ? "አዲስ ሪፖርት" : "Add Report"}
            </Button>
            <div className="w-full lg:w-60">
              <Autocomplete
                placeholder={isAm ? "መምህር ይፈልጉ..." : "Search for teacher..."}
                selectedKey={selectedTeacher || null}
                onSelectionChange={(key: React.Key | null) => {
                  const value = (key as string) || "";
                  setSelectedTeacher(value);
                  setModalTeacher(value);
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
          </div>
        </CardBody>
      </Card>

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
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetModalForm();
        }}
        size="lg"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{ backdrop: "bg-black/50 backdrop-blur-md" }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {isAm ? "አዲስ ዕለታዊ ሪፖርት" : "Create Daily Report"}
              </h2>
              <p className="text-sm text-default-500">
                {isAm
                  ? "መምህር፣ ተማሪ፣ ቀን እና ሁኔታ በአንድ ገጽ ይምረጡ"
                  : "Select teacher, student, date, and status on one page."}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid gap-3">
              <Autocomplete
                placeholder={isAm ? "መምህር ይፈልጉ..." : "Search teacher..."}
                label={isAm ? "መምህር *" : "Teacher *"}
                selectedKey={modalTeacher || null}
                onSelectionChange={(key: React.Key | null) => {
                  const value = (key as string) || "";
                  setModalTeacher(value);
                  setSelectedTeacher(value);
                  setSelectedStudent("");
                  setLearningSlot("");
                }}
                isLoading={isLoadingTeachers}
                defaultItems={teachersData?.data || []}
                listboxProps={{
                  emptyContent: isAm ? "ምንም መምህር አልተገኘም" : "No teachers found",
                }}
                variant="bordered"
                isClearable
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
                  >
                    {item.teacher.firstName} {item.teacher.fatherName}{" "}
                    {item.teacher.lastName}
                  </AutocompleteItem>
                )}
              </Autocomplete>

              <Autocomplete
                placeholder={isAm ? "ተማሪ ይፈልጉ..." : "Search student..."}
                label={isAm ? "ተማሪ *" : "Student *"}
                selectedKey={selectedStudent || null}
                onSelectionChange={(key: React.Key | null) => {
                  const value = (key as string) || "";
                  setSelectedStudent(value);
                  const studentData = studentsData?.data?.find(
                    (student: Record<string, unknown>) => student.id === value
                  ) as Record<string, unknown> | undefined;
                  if (studentData && Array.isArray(studentData.roomStudent)) {
                    const teacherRoom = studentData.roomStudent.find(
                      (room: Record<string, unknown>) =>
                        room.teacherId === modalTeacher
                    ) as Record<string, unknown> | undefined;
                    setLearningSlot((teacherRoom?.time as string) || "");
                  } else {
                    setLearningSlot("");
                  }
                }}
                isLoading={isLoadingStudents}
                defaultItems={studentsData?.data || []}
                listboxProps={{
                  emptyContent: isAm ? "ምንም ተማሪ አልተገኘም" : "No students found",
                }}
                variant="bordered"
                isClearable
                isDisabled={!modalTeacher}
              >
                {(student: {
                  id: string;
                  firstName: string;
                  fatherName: string;
                  lastName: string;
                  roomStudent?: Array<{ time: string; teacherId: string }>;
                }) => (
                  <AutocompleteItem
                    key={student.id}
                    textValue={`${student.firstName} ${student.fatherName} ${student.lastName}`}
                  >
                    <div className="py-1 font-medium">
                      {student.firstName} {student.fatherName}{" "}
                      {student.lastName}
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>

              <div className="grid gap-2">
                <label className="flex items-center justify-between gap-3 text-sm text-default-500">
                  <span>
                    {isAm
                      ? "ሰንበት እና እሁድ ብቻ ይፈቀድ"
                      : "Allow only Saturday & Sunday"}
                  </span>
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={weekendOnly}
                    onChange={(e) => setWeekendOnly(e.target.checked)}
                  />
                </label>
                <DatePicker
                  label={isAm ? "ቀን *" : "Date *"}
                  variant="bordered"
                  value={datePickerValue}
                  onChange={(value) =>
                    setReportDate(value ? value.toString() : "")
                  }
                  maxValue={todayValue}
                  isDateUnavailable={(date) => {
                    const weekday = date.toDate(timeZone).getDay();
                    if (weekendOnly) {
                      return !(weekday === 0 || weekday === 6);
                    }
                    return weekday === 0 || weekday === 6;
                  }}
                />
              </div>

              <Select
                label={isAm ? "የትምህርት ሁኔታ *" : "Learning Status *"}
                placeholder={isAm ? "ሁኔታ ይምረጡ" : "Select status"}
                selectedKeys={learningProgress ? [learningProgress] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as
                    | "present"
                    | "absent"
                    | "permission";
                  setLearningProgress(selected);
                }}
                classNames={{ value: "text-foreground" }}
                disallowEmptySelection
              >
                <SelectItem key="present" textValue="Present">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>{isAm ? "ተገኝቷል" : "Present"}</span>
                  </div>
                </SelectItem>
                <SelectItem key="absent" textValue="Absent">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>{isAm ? "ጠፍቷል" : "Absent"}</span>
                  </div>
                </SelectItem>
                <SelectItem key="permission" textValue="Permission">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{isAm ? "ፈቃድ" : "Permission"}</span>
                  </div>
                </SelectItem>
              </Select>

              {learningSlot && (
                <input type="hidden" value={learningSlot} readOnly />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setIsModalOpen(false);
                resetModalForm();
              }}
              isDisabled={isCreating}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color="primary"
              onPress={handleCreateReport}
              isLoading={isCreating}
              isDisabled={
                !modalTeacher ||
                !selectedStudent ||
                !reportDate ||
                !learningProgress ||
                !learningSlot
              }
            >
              {isAm ? "ሪፖርት ይፍጠሩ" : "Create Report"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
            {reportToDelete && (
              <div className="space-y-3 text-sm text-default-600">
                <p>
                  {isAm
                    ? "ይህን ሪፖርት መሰረዝ እርግጠኛ ነዎት?"
                    : "Are you sure you want to delete this report?"}
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
            )}
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
