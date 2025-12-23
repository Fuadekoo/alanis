"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
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
} from "@/components/ui/heroui";
import {
  createReport,
  deleteReport,
  getControllerStudentsCalendar,
} from "@/actions/controller/report";
import { Calendar, Search, PenSquare, Trash2 } from "lucide-react";
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

interface CalendarRow {
  student: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
    username?: string | null;
  };
  teacher: {
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  } | null;
  timeSlot: string;
  duration: number | null;
  reportsByDate: Record<number, CalendarReport | undefined>;
}

export default function Page() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Status modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [learningSlot, setLearningSlot] = useState("");
  const [learningProgress, setLearningProgress] = useState<
    "present" | "absent" | "permission" | ""
  >("");
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isWeekendTutorConfirmed, setIsWeekendTutorConfirmed] = useState(false);

  // Quick status modal (mobile long-press)
  const [isQuickStatusOpen, setIsQuickStatusOpen] = useState(false);
  const [quickStudent, setQuickStudent] = useState<{
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  } | null>(null);
  const [quickDay, setQuickDay] = useState<number | null>(null);
  const [quickWeekendTutorConfirmed, setQuickWeekendTutorConfirmed] =
    useState(false);

  // Optimistic updates: store newly created reports locally to avoid full refresh
  const [optimisticReports, setOptimisticReports] = useState<
    Record<string, Record<number, CalendarReport>>
  >({});

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

  // Get all controller's students with calendar data
  const [calendarData, isLoadingCalendar, refreshCalendar] = useData(
    getControllerStudentsCalendar,
    () => {},
    year,
    month
  );

  // Helper function to convert 24-hour time to 12-hour AM/PM format
  const formatTimeToAMPM = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Filter calendar data by search term
  const filteredCalendarData = useMemo(() => {
    if (!calendarData?.success || !calendarData.data)
      return [] as CalendarRow[];
    const rows = calendarData.data.calendarData as CalendarRow[];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((item: CalendarRow) => {
      const studentName =
        `${item.student.firstName} ${item.student.fatherName} ${item.student.lastName}`
          .toLowerCase()
          .trim();
      const teacherName = item.teacher
        ? `${item.teacher.firstName} ${item.teacher.fatherName} ${item.teacher.lastName}`
            .toLowerCase()
            .trim()
        : "";
      return (
        studentName.includes(normalized) || teacherName.includes(normalized)
      );
    });
  }, [calendarData, searchTerm]);

  const daysInMonth = calendarData?.data?.daysInMonth ?? 0;
  const totalStudents = filteredCalendarData.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

  useEffect(() => {
    setPage(1);
  }, [month, year, searchTerm, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedCalendarData = useMemo((): CalendarRow[] => {
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

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }, []);

  // Auto-scroll to today's date when month/year match
  useEffect(() => {
    if (isLoadingCalendar) return;
    if (!calendarData?.success) return;
    const today = new Date();
    const isSameMonthYear =
      today.getFullYear() === year && today.getMonth() + 1 === month;
    if (isSameMonthYear) {
      scrollToDay(Math.min(today.getDate(), daysInMonth));
    }
  }, [isLoadingCalendar, calendarData, year, month, daysInMonth]);

  // Get current student from calendar data when needed
  const getCurrentStudent = useCallback(
    (studentId: string) => {
      if (!calendarData?.success || !calendarData.data) return null;
      return (calendarData.data.calendarData as CalendarRow[]).find(
        (row) => row.student.id === studentId
      );
    },
    [calendarData]
  );

  const resetModalForm = () => {
    setSelectedStudent("");
    setSelectedStudentName("");
    setLearningSlot("");
    setLearningProgress("");
    setModalDate(null);
    setIsWeekendTutorConfirmed(false);
    setQuickWeekendTutorConfirmed(false);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    resetModalForm();
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
    if (
      !selectedTeacher ||
      !selectedStudent ||
      !modalDate ||
      !learningProgress
    ) {
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
    const selectedDateObj = new Date(modalDate);
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

    const day = selectedDateObj.getDate();
    const calendarRows = calendarData?.data?.calendarData as
      | CalendarRow[]
      | undefined;
    const duplicate = calendarRows?.find(
      (row) => row.student.id === selectedStudent
    )?.reportsByDate?.[day];

    const duplicateOptimistic = optimisticReports[selectedStudent]?.[day];

    if (duplicate || duplicateOptimistic) {
      showAlert({
        message: isAm
          ? "ለዚህ ቀን ሪፖርት አስቀድሞ አለ።"
          : "A report already exists for this date.",
        type: "warning",
        title: isAm ? "ዳግም ሪፖርት" : "Duplicate Report",
      });
      return;
    }

    if (isWeekendDay && !isWeekendTutorConfirmed) {
      showAlert({
        message: isAm
          ? "እባክዎ ለእረፍት ቀን የሚመዘገበው ዕለታዊ ሪፖርት በመምህር እንደሚካሄድ ያረጋግጡ"
          : "Please confirm this weekend session is led by a tutor before submitting.",
        type: "warning",
        title: isAm ? "ማረጋገጫ ያስፈልጋል" : "Confirmation Required",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createReport({
        studentId: selectedStudent,
        activeTeacherId: selectedTeacher,
        learningSlot,
        learningProgress,
        date: [
          selectedDateObj.getFullYear(),
          `${selectedDateObj.getMonth() + 1}`.padStart(2, "0"),
          `${selectedDateObj.getDate()}`.padStart(2, "0"),
        ].join("-"),
      });

      if (result.success) {
        showAlert({
          message: isAm
            ? "ሪፖርት በተሳካ ሁኔታ ተፈጥሯል!"
            : "Report created successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
        closeStatusModal();
        setMonth(selectedDateObj.getMonth() + 1);
        setYear(selectedDateObj.getFullYear());
        // Optimistically overlay the new report without refreshing the entire table
        const dayIndex = selectedDateObj.getDate();
        setOptimisticReports((prev) => ({
          ...prev,
          [selectedStudent]: {
            ...(prev[selectedStudent] || {}),
            [dayIndex]: {
              id: `local-${Date.now()}`,
              studentId: selectedStudent,
              date: [
                selectedDateObj.getFullYear(),
                `${selectedDateObj.getMonth() + 1}`.padStart(2, "0"),
                `${selectedDateObj.getDate()}`.padStart(2, "0"),
              ].join("-"),
              learningProgress: learningProgress as
                | "present"
                | "absent"
                | "permission",
              learningSlot: learningSlot,
              studentApproved: null,
              teacherApproved: null,
            },
          },
        }));
        // Auto-scroll to next date after successful creation
        const nextDay = Math.min(selectedDateObj.getDate() + 1, daysInMonth);
        scrollToDay(nextDay);
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

  const openQuickStatusModal = (
    student: {
      id: string;
      firstName: string;
      fatherName: string;
      lastName: string;
    },
    day: number
  ) => {
    const calendarRows = calendarData?.data?.calendarData as
      | CalendarRow[]
      | undefined;
    const studentRow = calendarRows?.find(
      (row) => row.student.id === student.id
    );
    if (!studentRow || !studentRow.teacher || !studentRow.timeSlot) {
      // Fallback to full modal if required info missing
      handleOpenStatusModal(student, day);
      return;
    }
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);
    const duplicate = studentRow.reportsByDate?.[day];
    const duplicateOptimistic = optimisticReports[student.id]?.[day];
    if (duplicate || duplicateOptimistic) {
      showAlert({
        message: isAm
          ? "ለዚህ ቀን ሪፖርት አስቀድሞ አለ"
          : "A report already exists for this day",
        type: "warning",
        title: isAm ? "ዳግም ሪፖርት" : "Duplicate",
      });
      return;
    }
    setQuickStudent(student);
    setQuickDay(day);
    setQuickWeekendTutorConfirmed(false);
    setIsQuickStatusOpen(true);
  };

  const handleQuickCreateReport = async (
    progress: "present" | "permission" | "absent"
  ) => {
    if (!quickStudent || quickDay == null) return;
    const calendarRows = calendarData?.data?.calendarData as
      | CalendarRow[]
      | undefined;
    const studentRow = calendarRows?.find(
      (row) => row.student.id === quickStudent.id
    );
    if (!studentRow || !studentRow.teacher || !studentRow.timeSlot) {
      setIsQuickStatusOpen(false);
      handleOpenStatusModal(quickStudent, quickDay);
      return;
    }

    const dateObj = new Date(year, month - 1, quickDay);
    dateObj.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj > today) {
      showAlert({
        message: isAm
          ? "ለወደፊት ቀናት ሪፖርት መፍጠር አይችሉም"
          : "You cannot create reports for future dates.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend && !quickWeekendTutorConfirmed) {
      showAlert({
        message: isAm
          ? "እባክዎ ለእረፍት ቀን የሚመዘገበው ዕለታዊ ሪፖርት በመምህር እንደሚካሄድ ያረጋግጡ"
          : "Please confirm this weekend session is led by a tutor before submitting.",
        type: "warning",
        title: isAm ? "ማረጋገጫ ያስፈልጋል" : "Confirmation Required",
      });
      return;
    }

    try {
      const result = await createReport({
        studentId: quickStudent.id,
        activeTeacherId: studentRow.teacher.id,
        learningSlot: studentRow.timeSlot,
        learningProgress: progress,
        date: [
          dateObj.getFullYear(),
          `${dateObj.getMonth() + 1}`.padStart(2, "0"),
          `${dateObj.getDate()}`.padStart(2, "0"),
        ].join("-"),
      });

      if (result.success) {
        showAlert({
          message: isAm
            ? "ሪፖርት በተሳካ ሁኔታ ተፈጥሯል!"
            : "Report created successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
        setIsQuickStatusOpen(false);
        setMonth(dateObj.getMonth() + 1);
        setYear(dateObj.getFullYear());
        // Optimistically overlay the new report without refreshing the entire table
        const dayIndex = dateObj.getDate();
        setOptimisticReports((prev) => ({
          ...prev,
          [quickStudent.id]: {
            ...(prev[quickStudent.id] || {}),
            [dayIndex]: {
              id: `local-${Date.now()}`,
              studentId: quickStudent.id,
              date: [
                dateObj.getFullYear(),
                `${dateObj.getMonth() + 1}`.padStart(2, "0"),
                `${dateObj.getDate()}`.padStart(2, "0"),
              ].join("-"),
              learningProgress: progress,
              learningSlot: studentRow.timeSlot,
              studentApproved: null,
              teacherApproved: null,
            },
          },
        }));
        const nextDay = Math.min(dateObj.getDate() + 1, daysInMonth);
        scrollToDay(nextDay);
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
    }
  };

  const startLongPress = (
    student: {
      id: string;
      firstName: string;
      fatherName: string;
      lastName: string;
    },
    day: number
  ) => {
    if (!isTouchDevice) return;
    cancelLongPress();
    didLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      didLongPressRef.current = true;
      openQuickStatusModal(student, day);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const scrollToDay = (day: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Fixed columns total width: 480px; each day column: 50px
    const targetLeft = 480 + (day - 1) * 50;
    const offset = 200; // show a bit of context before the target
    const left = Math.max(0, targetLeft - offset);
    container.scrollTo({ left, behavior: "smooth" });
  };

  const handleOpenStatusModal = (
    student: {
      id: string;
      firstName: string;
      fatherName: string;
      lastName: string;
    },
    day: number
  ) => {
    const calendarRows = calendarData?.data?.calendarData as
      | CalendarRow[]
      | undefined;

    // Get student's teacher and time slot from calendar data
    const studentRow = calendarRows?.find(
      (row) => row.student.id === student.id
    );

    if (!studentRow) {
      showAlert({
        message: isAm ? "የተማሪ መረጃ አልተገኘም" : "Student information not found",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    if (!studentRow.teacher) {
      showAlert({
        message: isAm
          ? "ለዚህ ተማሪ መምህር አልተገኘም"
          : "No teacher assigned to this student",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    const slot = studentRow.timeSlot || "";
    if (!slot) {
      showAlert({
        message: isAm
          ? "ለዚህ ተማሪ የትምህርት ጊዜ አልተገኘም"
          : "No learning slot found for this student",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);

    const duplicate = studentRow.reportsByDate?.[day];

    if (duplicate) {
      showAlert({
        message: isAm
          ? "ለዚህ ቀን ሪፖርት አስቀድሞ አለ"
          : "A report already exists for this day",
        type: "warning",
        title: isAm ? "ዳግም ሪፖርት" : "Duplicate",
      });
      return;
    }

    setSelectedStudent(student.id);
    setSelectedStudentName(
      `${student.firstName} ${student.fatherName} ${student.lastName}`
    );
    setSelectedTeacher(studentRow.teacher.id);
    setLearningSlot(slot);
    setLearningProgress("");
    setModalDate(dateObj);
    setIsWeekendTutorConfirmed(false);
    setIsStatusModalOpen(true);
  };

  const modalDateLabel = useMemo(() => {
    if (!modalDate) return "";
    return modalDate.toLocaleDateString(isAm ? "am-ET" : undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [modalDate, isAm]);

  const modalWeekday = useMemo(() => {
    if (!modalDate) return "";
    return modalDate.toLocaleDateString(isAm ? "am-ET" : undefined, {
      weekday: "long",
    });
  }, [modalDate, isAm]);

  const isWeekendDay = useMemo(() => {
    if (!modalDate) return false;
    const day = modalDate.getDay();
    return day === 0 || day === 6;
  }, [modalDate]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 lg:p-6 gap-4">
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-default-900">
              <Calendar className="size-6 text-primary" />
              {isAm ? "የወር ሪፖርት አቀራረብ" : "Monthly Report View"}
            </h1>
          </div>
        </CardBody>
      </Card>

      {/* Calendar View - Horizontal Display */}
      <Card className="flex-1 overflow-hidden border border-default-200/70 shadow-sm">
        <CardHeader className="p-4 border-b border-default-200 bg-default-50 dark:bg-default-900/30">
          <div className="flex items-center gap-2 w-full">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isAm
                  ? "ተማሪን ወይም መምህርን በፍጥነት ለመፈለግ ይጻፉ..."
                  : "Quick search for a student or teacher..."
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
            <div className="flex flex-col gap-3 h-full">
              <div
                className="overflow-x-auto overflow-y-auto w-full h-full"
                ref={scrollContainerRef}
              >
                <table
                  className="border-collapse text-sm"
                  style={{ minWidth: `${480 + daysInMonth * 50}px` }}
                >
                  <thead className="sticky top-0 bg-default-100 dark:bg-default-900/80 backdrop-blur">
                    <tr>
                      <th className="border border-default-200/70 p-2 text-left font-semibold w-[180px] min-w-[180px] sticky left-0 bg-default-100 dark:bg-default-900/80 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                        {isAm ? "ተማሪ" : "Student"}
                      </th>
                      <th className="border border-default-200/70 p-2 text-left font-semibold w-[180px] min-w-[180px] bg-default-100 dark:bg-default-900/80">
                        {isAm ? "መምህር" : "Teacher"}
                      </th>
                      <th className="border border-default-200/70 p-2 text-left font-semibold w-[120px] min-w-[120px] bg-default-100 dark:bg-default-900/80">
                        {isAm ? "የትምህርት ሰዓት" : "Time Slot"}
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                        (day) => (
                          <th
                            key={day}
                            className="border border-default-200/70 p-1 text-center font-semibold w-[50px] min-w-[50px] text-[11px] text-default-500"
                          >
                            {day}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalendarData.length > 0 ? (
                      paginatedCalendarData.map(
                        (item: CalendarRow, rowIndex: number) => {
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
                              <td
                                className={`border border-default-200/70 p-2 text-default-600 dark:text-default-300 w-[180px] min-w-[180px] ${rowBgClass}`}
                              >
                                {item.teacher ? (
                                  <span className="text-sm">
                                    {item.teacher.firstName}{" "}
                                    {item.teacher.fatherName}{" "}
                                    {item.teacher.lastName}
                                  </span>
                                ) : (
                                  <span className="text-sm text-default-400">
                                    {isAm ? "የለም" : "N/A"}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`border border-default-200/70 p-2 text-default-600 dark:text-default-300 w-[120px] min-w-[120px] ${rowBgClass}`}
                              >
                                {item.timeSlot ? (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                  >
                                    {formatTimeToAMPM(item.timeSlot)}
                                  </Chip>
                                ) : (
                                  <span className="text-sm text-default-400">
                                    {isAm ? "የለም" : "N/A"}
                                  </span>
                                )}
                              </td>
                              {Array.from(
                                { length: daysInMonth },
                                (_, i) => i + 1
                              ).map((day) => {
                                const optimisticForStudent =
                                  optimisticReports[item.student.id] || {};
                                const serverReport = item.reportsByDate[day] as
                                  | CalendarReport
                                  | undefined;
                                const optimisticReport = optimisticForStudent[
                                  day
                                ] as CalendarReport | undefined;
                                const report = serverReport || optimisticReport;
                                const isOptimistic =
                                  !!optimisticReport && !serverReport;

                                if (!report) {
                                  return (
                                    <td
                                      key={day}
                                      className="border border-default-200/60 p-1 text-center align-middle"
                                    >
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        color="primary"
                                        variant="light"
                                        className="min-w-unit-6 w-6 h-6"
                                        onPress={() => {
                                          if (didLongPressRef.current) {
                                            // Suppress click after long-press
                                            didLongPressRef.current = false;
                                            return;
                                          }
                                          handleOpenStatusModal(
                                            item.student,
                                            day
                                          );
                                        }}
                                        onPointerDown={() =>
                                          startLongPress(item.student, day)
                                        }
                                        onPointerUp={cancelLongPress}
                                        onPointerLeave={cancelLongPress}
                                      >
                                        <PenSquare className="size-3" />
                                      </Button>
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
                                      {!isOptimistic && (
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
                                      )}
                                    </div>
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
                          colSpan={daysInMonth + 3 || 3}
                          className="border border-default-200 p-8 text-center text-default-500"
                        >
                          {searchTerm.trim().length > 0
                            ? isAm
                              ? "ተማሪ አልተገኘም። እባክዎ የፍለጋ ቃልን ይለውጡ።"
                              : "No students match your search. Try a different keyword."
                            : isAm
                            ? "ምንም ተማሪዎች አልተገኙም"
                            : "No students found"}
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

      {/* Quick Status Modal for mobile long-press */}
      <Modal
        isOpen={isQuickStatusOpen}
        onClose={() => {
          setIsQuickStatusOpen(false);
          setQuickStudent(null);
          setQuickDay(null);
          setQuickWeekendTutorConfirmed(false);
        }}
        size="sm"
        backdrop="blur"
        classNames={{ backdrop: "bg-black/50 backdrop-blur-md" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-bold">
              {isAm ? "በፍጥነት ሁኔታ ይምረጡ" : "Quick Select Status"}
            </h2>
            {quickStudent && quickDay != null && (
              <p className="text-sm text-default-500">
                {(isAm ? "ተማሪ:" : "Student:") + " "}
                {quickStudent.firstName} {quickStudent.fatherName}{" "}
                {quickStudent.lastName}
                {" · "}
                {(isAm ? "ቀን:" : "Day:") + " "}
                {quickDay}
              </p>
            )}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {(() => {
              if (quickDay == null) return null;
              const dateObj = new Date(year, month - 1, quickDay);
              const isWeekend = [0, 6].includes(dateObj.getDay());
              return (
                <>
                  {isWeekend && (
                    <label className="flex gap-3 rounded-lg border border-default-200/60 bg-default-100/40 dark:bg-default-900/30 p-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-default-300 text-primary focus:ring-primary"
                        checked={quickWeekendTutorConfirmed}
                        onChange={(e) =>
                          setQuickWeekendTutorConfirmed(e.target.checked)
                        }
                      />
                      <span className="text-default-600 dark:text-default-300 leading-tight">
                        {isAm
                          ? "ይህ እረፍት ቀን ትምህርት በመምህር እንደሚካሄድ እመሰክራለሁ"
                          : "I confirm this weekend session is conducted by a tutor."}
                      </span>
                    </label>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      color="success"
                      onPress={() => handleQuickCreateReport("present")}
                    >
                      {isAm ? "ተገኝ" : "Present"}
                    </Button>
                    <Button
                      color="primary"
                      onPress={() => handleQuickCreateReport("permission")}
                    >
                      {isAm ? "ፈቃድ" : "Permission"}
                    </Button>
                    <Button
                      color="danger"
                      onPress={() => handleQuickCreateReport("absent")}
                    >
                      {isAm ? "ጠፋ" : "Absent"}
                    </Button>
                  </div>
                </>
              );
            })()}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsQuickStatusOpen(false)}>
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={closeStatusModal}
        size="md"
        backdrop="blur"
        classNames={{ backdrop: "bg-black/50 backdrop-blur-md" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">
              {isAm ? "አዲስ ሪፖርት ይመዝግቡ" : "Log Daily Report"}
            </h2>
            <p className="text-sm text-default-500">
              {isAm
                ? "ተመረጠውን ቀን ለተማሪው የትምህርት ሁኔታ ይምረጡ።"
                : "Choose the learning status for the selected day."}
            </p>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid gap-2 rounded-lg border border-default-200/60 bg-default-100/60 dark:bg-default-900/30 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-default-500">
                  {isAm ? "መምህር" : "Teacher"}
                </span>
                <span className="font-semibold text-default-900 dark:text-default-100">
                  {selectedTeacher
                    ? (() => {
                        const studentRow = getCurrentStudent(selectedStudent);
                        return studentRow?.teacher
                          ? `${studentRow.teacher.firstName} ${studentRow.teacher.fatherName} ${studentRow.teacher.lastName}`
                          : isAm
                          ? "መምህር አልተገኘም"
                          : "Teacher not found";
                      })()
                    : isAm
                    ? "መምህር ይምረጡ"
                    : "Select a teacher"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-default-500">
                  {isAm ? "ተማሪ" : "Student"}
                </span>
                <span className="font-semibold text-default-900 dark:text-default-100">
                  {selectedStudentName ||
                    (isAm ? "ተማሪ ይምረጡ" : "Select a student")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-default-500">{isAm ? "ቀን" : "Date"}</span>
                <span className="font-semibold text-default-900 dark:text-default-100">
                  {modalDate
                    ? `${modalDateLabel} · ${modalWeekday}`
                    : isAm
                    ? "ቀን ይምረጡ"
                    : "Select a date"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-default-500">
                  {isAm ? "የትምህርት ሰዓት" : "Learning Slot"}
                </span>
                <Chip size="sm" variant="flat" color="primary">
                  {learningSlot || (isAm ? "ተርፎ የለም" : "Not available")}
                </Chip>
              </div>
            </div>
            {modalDate && (
              <Chip
                size="sm"
                variant="flat"
                color={isWeekendDay ? "success" : "warning"}
                className="w-max"
              >
                {isWeekendDay
                  ? isAm
                    ? "እረፍት ቀን ቢሆንም ሪፖርት ሊመዘገብ ይችላል"
                    : "Weekend day selected"
                  : isAm
                  ? "ዕለታዊ መዝገብ"
                  : "Weekday session"}
              </Chip>
            )}
            {isWeekendDay && (
              <label className="flex gap-3 rounded-lg border border-default-200/60 bg-default-100/40 dark:bg-default-900/30 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-default-300 text-primary focus:ring-primary"
                  checked={isWeekendTutorConfirmed}
                  onChange={(event) =>
                    setIsWeekendTutorConfirmed(event.target.checked)
                  }
                />
                <span className="text-default-600 dark:text-default-300 leading-tight">
                  {isAm
                    ? "ይህ እረፍት ቀን ትምህርት በመምህር እንደሚካሄድ እመሰክራለሁ"
                    : "I confirm this weekend session is conducted by a tutor."}
                </span>
              </label>
            )}
            <Select
              label={isAm ? "የትምህርት ሁኔታ *" : "Learning Status *"}
              placeholder={isAm ? "ሁኔታ ይምረጡ" : "Select status"}
              selectedKeys={learningProgress ? [learningProgress] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as
                  | "present"
                  | "absent"
                  | "permission"
                  | undefined;
                setLearningProgress(value ?? "");
              }}
            >
              <SelectItem key="present">{isAm ? "ተገኝ" : "Present"}</SelectItem>
              <SelectItem key="permission">
                {isAm ? "ፈቃድ" : "Permission"}
              </SelectItem>
              <SelectItem key="absent">{isAm ? "ጠፋ" : "Absent"}</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={closeStatusModal}
              isDisabled={isCreating}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            <Button
              color="primary"
              onPress={handleCreateReport}
              isLoading={isCreating}
              isDisabled={
                !learningProgress ||
                !modalDate ||
                !selectedStudent ||
                isCreating ||
                (isWeekendDay && !isWeekendTutorConfirmed)
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
          setIsDeleteModalOpen(false);
          setReportToDelete(null);
        }}
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-lg font-semibold">
              {isAm ? "ሪፖርት ማጥፋት" : "Delete Report"}
            </h2>
          </ModalHeader>
          <ModalBody className="space-y-3">
            <p className="text-sm text-default-500">
              {isAm
                ? "ይህን ሪፖርት ለማጥፋት እርግጠኛ ነዎት?"
                : "Are you sure you want to delete this report?"}
            </p>
            {reportToDelete && (
              <div className="rounded-lg border border-default-200/60 bg-default-100/50 dark:bg-default-900/40 p-3 text-sm space-y-1">
                <p className="font-medium text-default-700 dark:text-default-200">
                  {reportToDelete.studentName}
                </p>
                <p className="text-default-500">
                  {reportToDelete.date}
                  {reportToDelete.learningProgress
                    ? ` · ${
                        isAm
                          ? reportToDelete.learningProgress === "present"
                            ? "ተገኝ"
                            : reportToDelete.learningProgress === "permission"
                            ? "ፈቃድ"
                            : "ጠፋ"
                          : reportToDelete.learningProgress
                      }`
                    : ""}
                </p>
                {reportToDelete.learningSlot && (
                  <Chip size="sm" variant="flat" color="primary">
                    {reportToDelete.learningSlot}
                  </Chip>
                )}
              </div>
            )}
            <p className="text-xs text-default-400">
              {isAm
                ? "የተሰረዘ ሪፖርት መመለስ አይቻልም። የመምህሩ ሂደት ቁጥር እንደተቀነሰ ይሆናል።"
                : "This action cannot be undone. The teacher's progress counts will be adjusted."}
            </p>
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
              {isAm ? "ሪፖርት ያጥፉ" : "Delete"}
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
      />
    </div>
  );
}
