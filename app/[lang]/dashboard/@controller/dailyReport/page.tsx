"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Skeleton,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ScrollShadow,
} from "@/components/ui/heroui";
import {
  getAllReports,
  getStudentsForReport,
  getTeachersForReport,
  createReport,
  deleteReport,
} from "@/actions/controller/report";
import { Search, Plus, Calendar, User, BookOpen, Trash2 } from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Teacher, 2: Select Student, 3: Fill Details
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [learningSlot, setLearningSlot] = useState("");
  const [learningProgress, setLearningProgress] = useState<
    "present" | "absent" | "permission" | ""
  >("");
  const [reportDate, setReportDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    studentName: string;
    teacherName: string;
    date: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();

  // Get reports data
  const [reportsData, isLoadingReports, refreshReports] = useData(
    getAllReports,
    () => {},
    currentPage,
    10,
    search
  );

  // Get students for selection - only when teacher is selected
  const [studentsData, isLoadingStudents] = useData(
    getStudentsForReport,
    () => {},
    selectedTeacher || ""
  );

  // Get teachers for selection
  const [teachersData, isLoadingTeachers] = useData(
    getTeachersForReport,
    () => {}
  );

  const resetForm = () => {
    setStep(1);
    setSelectedStudent("");
    setSelectedTeacher("");
    setLearningSlot("");
    setLearningProgress("");
    setReportDate("");
  };

  const handleCreateReport = async () => {
    // Check if learning slot was auto-filled from room data
    if (!learningSlot) {
      showAlert({
        message: isAm
          ? "የትምህርት ሰዓት አልተገኘም። እባክዎ ለዚህ መምህር እና ተማሪ የክፍል ምደባ (room assignment) እንዳለ ያረጋግጡ።"
          : "Learning time not found. Please ensure there is a room assignment for this teacher and student.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    if (
      !selectedStudent ||
      !selectedTeacher ||
      !reportDate ||
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

    // Check if the selected date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(reportDate);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj > today) {
      showAlert({
        message: isAm
          ? "ለወደፊት ቀናት ሪፖርት መፍጠር አይችሉም። እባክዎ ዛሬን ወይም ያለፈውን ቀን ይምረጡ"
          : "You cannot create reports for future dates. Please select today or a past date",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    // Check for duplicate report (same teacher, student, and date)
    if (reportsData?.data?.reports) {
      const selectedDate = new Date(reportDate).toDateString();
      const duplicate = reportsData.data.reports.find((report) => {
        const reportDate = new Date(report.date).toDateString();
        return (
          report.student.id === selectedStudent &&
          report.activeTeacher.id === selectedTeacher &&
          reportDate === selectedDate
        );
      });

      if (duplicate) {
        showAlert({
          message: isAm
            ? `ለዚህ መምህር እና ተማሪ በዚህ ቀን (${new Date(
                reportDate
              ).toLocaleDateString()}) ሪፖርት ቀድሞውኑ ተፈጥሯል። እባክዎ ሌላ ቀን ይምረጡ ወይም ያለውን ሪፖርት ያርትዑ።`
            : `A report for this teacher and student already exists on ${new Date(
                reportDate
              ).toLocaleDateString()}. Please select a different date or edit the existing report.`,
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
        activeTeacherId: selectedTeacher,
        learningSlot,
        learningProgress,
        date: new Date(reportDate),
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
        resetForm();
        // Refresh reports data
        window.location.reload();
      } else {
        showAlert({
          message:
            result.error ||
            (isAm ? "ሪፖርት መፍጠር አልተሳካም" : "Failed to create report"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch {
      showAlert({
        message: isAm ? "ሪፖርት መፍጠር አልተሳካም" : "Failed to create report",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (report: {
    id: string;
    student: { firstName: string; lastName: string };
    activeTeacher: { firstName: string; lastName: string };
    date: string | Date;
    teacherProgress: { progressStatus: string } | null;
    shiftTeacherDataId?: string | null;
  }) => {
    // Check if report belongs to shifted teacher data
    if (report.shiftTeacherDataId) {
      showAlert({
        message: isAm
          ? "ይህ ሪፖርት ወደ ሌላ መምህር የተዛወረ ታሪካዊ መረጃ ነው። ታሪካዊ ሪፖርቶችን መሰረዝ አይችሉም።"
          : "This report belongs to shifted teacher data (historical records). You cannot delete historical reports.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    // Check if teacherProgress exists
    if (!report.teacherProgress) {
      showAlert({
        message: isAm
          ? "የዚህ ሪፖርት የመምህር ሂደት አልተገኘም።"
          : "Teacher progress not found for this report.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    // Check if progress is closed
    if (report.teacherProgress.progressStatus !== "open") {
      showAlert({
        message: isAm
          ? "የዚህ ሪፖርት የመምህር ሂደት ተዘግቷል። የተዘጉ ሂደቶችን ሪፖርቶች መሰረዝ አይችሉም።"
          : "This report's teacher progress is closed. You cannot delete reports from closed progress records.",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
      return;
    }

    setReportToDelete({
      id: report.id,
      studentName: `${report.student.firstName} ${report.student.lastName}`,
      teacherName: `${report.activeTeacher.firstName} ${report.activeTeacher.lastName}`,
      date: new Date(report.date).toLocaleDateString(),
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
        // Refresh the reports list
        if (refreshReports) {
          refreshReports();
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
    } catch {
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Content */}
      <div className="p-2 lg:p-5 grid grid-rows-[auto_1fr_auto] gap-5 overflow-hidden">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder={isAm ? "ፈልግ..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Search className="size-4" />}
            variant="bordered"
            className="flex-1"
          />
          <Button
            color="primary"
            startContent={<Plus className="size-4" />}
            onPress={() => {
              setIsModalOpen(true);
              resetForm();
            }}
            className="shrink-0"
          >
            {isAm ? "አዲስ ሪፖርት" : "New Report"}
          </Button>
          <div className="px-3 py-2 bg-default-50/50 rounded-lg text-center content-center font-semibold">
            {reportsData?.data?.totalCount ?? 0}
          </div>
        </div>

        {/* Reports List */}
        {isLoadingReports ? (
          <Skeleton className="w-full h-full rounded-xl" />
        ) : (
          <ScrollShadow className="p-2 pb-20 bg-default-50/50 border border-default-100/20 rounded-xl grid gap-2 auto-rows-min xl:grid-cols-2">
            {reportsData?.success &&
            reportsData.data &&
            reportsData.data.reports &&
            reportsData.data.reports.length > 0 ? (
              reportsData.data.reports.map((report, i) => (
                <Card
                  key={report.id}
                  className="h-fit bg-default-50/30 backdrop-blur-sm border-2 border-default-400 hover:border-primary-400 transition-all"
                >
                  <CardBody className="p-2">
                    {/* Line 1: Student & Teacher */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {i + 1 + (currentPage - 1) * 10}
                      </div>
                      <User className="size-3 text-primary shrink-0" />
                      <span className="font-semibold text-sm">
                        {highlight(
                          `${report.student.firstName} ${report.student.lastName}`,
                          search
                        )}
                      </span>
                      <BookOpen className="size-3 text-secondary shrink-0 ml-auto" />
                      <span className="text-xs text-default-600">
                        {highlight(
                          `${report.activeTeacher.firstName} ${report.activeTeacher.lastName}`,
                          search
                        )}
                      </span>
                      {/* Delete Button - Only show if progress is open and not shifted data */}
                      {!report.shiftTeacherDataId &&
                        report.teacherProgress?.progressStatus === "open" && (
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDeleteClick(report)}
                            className="min-w-unit-6 w-6 h-6"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                    </div>

                    {/* Line 2: Date, Slot, Status & Student Approval */}
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="size-3 text-secondary shrink-0" />
                      <span className="text-default-500">
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                      <span className="text-default-400">•</span>
                      <span className="text-default-600">
                        {report.learningSlot}
                      </span>
                      <Chip
                        color={
                          report.learningProgress === "present"
                            ? "success"
                            : report.learningProgress === "permission"
                            ? "primary"
                            : "warning"
                        }
                        size="sm"
                        variant="dot"
                        className="h-5"
                      >
                        {report.learningProgress === "present"
                          ? isAm
                            ? "ተገኝቷል"
                            : "Present"
                          : report.learningProgress === "permission"
                          ? isAm
                            ? "ፈቃድ"
                            : "Permission"
                          : isAm
                          ? "ጠፍቷል"
                          : "Absent"}
                      </Chip>
                      {report.studentApproved !== null &&
                        report.studentApproved !== undefined && (
                          <Chip
                            size="sm"
                            color={
                              report.studentApproved ? "success" : "danger"
                            }
                            variant="flat"
                            className="h-5 ml-auto"
                          >
                            {report.studentApproved
                              ? isAm
                                ? "ተማሪ ጸድቋል"
                                : "Student ✓"
                              : isAm
                              ? "ተማሪ አልተቀበለም"
                              : "Student ✗"}
                          </Chip>
                        )}
                      {(report.studentApproved === null ||
                        report.studentApproved === undefined) && (
                        <Chip
                          size="sm"
                          color="warning"
                          variant="flat"
                          className="h-5 ml-auto"
                        >
                          {isAm ? "በመጠባበቅ ላይ" : "Pending"}
                        </Chip>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="size-20 text-default-300 mb-4" />
                <h3 className="text-xl font-semibold text-default-600 mb-2">
                  {isAm ? "ምንም ሪፖርት አልተገኘም" : "No Reports Found"}
                </h3>
                <p className="text-sm text-default-400 max-w-md">
                  {isAm
                    ? "ገና ምንም ዕለታዊ ሪፖርት አልተፈጠረም። አዲስ ሪፖርት ለመፍጠር ከላይ ያለውን ቁልፍ ይጫኑ።"
                    : "No daily reports have been created yet. Click the New Report button above to create one."}
                </p>
              </div>
            )}
          </ScrollShadow>
        )}

        {/* Pagination */}
        <PaginationPlace
          currentPage={currentPage}
          totalPage={Math.ceil((reportsData?.data?.totalCount ?? 0) / 10) || 1}
          onPageChange={setCurrentPage}
          sort={false}
          onSortChange={() => {}}
          row={10}
          onRowChange={() => {}}
        />
      </div>

      {/* Create Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-md",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">
              {isAm ? "አዲስ ሪፖርት ይፍጠሩ" : "Create New Report"}
            </h2>
            <p className="text-sm text-default-500 font-normal">
              {isAm
                ? "ሪፖርት ለመፍጠር ደረጃዎቹን ይከተሉ"
                : "Follow the steps to create a report"}
            </p>
          </ModalHeader>
          <ModalBody>
            {/* Step Indicator */}
            <div className="flex items-center gap-2 p-4 bg-default-50 rounded-lg mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 1
                    ? "bg-primary text-white"
                    : "bg-default-200 text-default-500"
                }`}
              >
                1
              </div>
              <span
                className={
                  step >= 1 ? "text-primary font-semibold" : "text-default-500"
                }
              >
                {isAm ? "መምህር" : "Teacher"}
              </span>
              <div className="flex-1 h-0.5 bg-default-200"></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 2
                    ? "bg-primary text-white"
                    : "bg-default-200 text-default-500"
                }`}
              >
                2
              </div>
              <span
                className={
                  step >= 2 ? "text-primary font-semibold" : "text-default-500"
                }
              >
                {isAm ? "ተማሪ" : "Student"}
              </span>
              <div className="flex-1 h-0.5 bg-default-200"></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 3
                    ? "bg-primary text-white"
                    : "bg-default-200 text-default-500"
                }`}
              >
                3
              </div>
              <span
                className={
                  step >= 3 ? "text-primary font-semibold" : "text-default-500"
                }
              >
                {isAm ? "ዝርዝሮች" : "Details"}
              </span>
            </div>

            {/* Step 1: Select Teacher */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isAm ? "መምህር ይምረጡ" : "Select Teacher"}
                  </h3>
                  <p className="text-sm text-default-500 mb-4">
                    {isAm
                      ? "ሪፖርት ለመፍጠር መምህር ይምረጡ"
                      : "Choose a teacher to create a report for"}
                  </p>
                </div>
                <Autocomplete
                  placeholder={isAm ? "መምህር ይፈልጉ..." : "Search for teacher..."}
                  selectedKey={selectedTeacher}
                  onSelectionChange={(key: React.Key | null) => {
                    setSelectedTeacher(key as string);
                  }}
                  isLoading={isLoadingTeachers}
                  label={isAm ? "መምህር *" : "Teacher *"}
                  defaultItems={teachersData?.data || []}
                  listboxProps={{
                    emptyContent: isAm
                      ? "ምንም መምህር አልተገኘም"
                      : "No teachers found",
                  }}
                  classNames={{
                    base: selectedTeacher
                      ? "border-2 border-success-300 dark:border-success-600 rounded-lg"
                      : "",
                  }}
                  description={
                    selectedTeacher
                      ? isAm
                        ? "✓ መምህር ተመርጧል"
                        : "✓ Teacher selected"
                      : isAm
                      ? "መምህርን ለመፈለግ መታየብ ይጀምሩ"
                      : "Start typing to search for teachers"
                  }
                  isClearable
                >
                  {(teacher: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    username: string;
                  }) => (
                    <AutocompleteItem
                      key={teacher.id}
                      textValue={`${teacher.firstName} ${teacher.lastName}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </span>
                        <span className="text-xs text-default-400">
                          @{teacher.username}
                        </span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              </div>
            )}

            {/* Step 2: Select Student */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isAm ? "ተማሪ ይምረጡ" : "Select Student"}
                  </h3>
                  <p className="text-sm text-default-500 mb-4">
                    {isAm
                      ? "ሪፖርት የሚፈጠርለት ተማሪ ይምረጡ"
                      : "Choose the student for this report"}
                  </p>
                </div>
                <Autocomplete
                  placeholder={isAm ? "ተማሪ ይፈልጉ..." : "Search for student..."}
                  selectedKey={selectedStudent}
                  onSelectionChange={(key: React.Key | null) => {
                    setSelectedStudent(key as string);

                    // Auto-fill learning slot from student's room data FOR THE SELECTED TEACHER
                    const studentData = studentsData?.data?.find(
                      (student: Record<string, unknown>) => student.id === key
                    ) as Record<string, unknown> | undefined;

                    if (studentData && Array.isArray(studentData.roomStudent)) {
                      // Find the room that matches the selected teacher
                      const teacherRoom = studentData.roomStudent.find(
                        (room: Record<string, unknown>) =>
                          room.teacherId === selectedTeacher
                      ) as Record<string, unknown> | undefined;

                      if (teacherRoom) {
                        setLearningSlot((teacherRoom.time as string) || "");
                      } else {
                        setLearningSlot("");
                      }
                    } else {
                      setLearningSlot("");
                    }
                  }}
                  isLoading={isLoadingStudents}
                  label={isAm ? "ተማሪ *" : "Student *"}
                  defaultItems={studentsData?.data || []}
                  listboxProps={{
                    emptyContent: isAm
                      ? "ምንም ተማሪ አልተገኘም"
                      : "No students found for this teacher",
                  }}
                  classNames={{
                    base: selectedStudent
                      ? "border-2 border-success-300 dark:border-success-600 rounded-lg"
                      : "",
                  }}
                  description={
                    selectedStudent
                      ? isAm
                        ? "✓ ተማሪ ተመርጧል"
                        : "✓ Student selected"
                      : isAm
                      ? "ተማሪውን ለመፈለግ መታየብ ይጀምሩ"
                      : "Start typing to search for students"
                  }
                  isClearable
                >
                  {(student: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    username: string;
                    roomStudent?: Array<{ time: string; teacherId: string }>;
                  }) => {
                    // Find the room for the selected teacher
                    const teacherRoom = Array.isArray(student.roomStudent)
                      ? student.roomStudent.find(
                          (room) => room.teacherId === selectedTeacher
                        )
                      : undefined;

                    return (
                      <AutocompleteItem
                        key={student.id}
                        textValue={`${student.firstName} ${student.lastName}`}
                      >
                        <div className="flex flex-col py-1">
                          <span className="font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="text-xs text-default-400">
                            @{student.username}
                          </span>
                          {teacherRoom && (
                            <span className="text-xs text-primary mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              {isAm ? "ሰዓት" : "Time"}: {teacherRoom.time}
                            </span>
                          )}
                        </div>
                      </AutocompleteItem>
                    );
                  }}
                </Autocomplete>
              </div>
            )}

            {/* Step 3: Fill Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isAm ? "ዝርዝሮች ይሙሉ" : "Fill Details"}
                  </h3>
                  <p className="text-sm text-default-500 mb-4">
                    {isAm
                      ? "ሪፖርቱን ለመጠናቀቅ ዝርዝሮች ይሙሉ"
                      : "Complete the report details"}
                  </p>
                </div>
                <div className="space-y-4">
                  <Input
                    type="date"
                    label={isAm ? "ቀን *" : "Date *"}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    variant="bordered"
                    description={
                      isAm
                        ? "ለዛሬ ወይም ለያለፉ ቀናት ብቻ ሪፖርት መፍጠር ይችላሉ"
                        : "You can only create reports for today or past dates"
                    }
                    classNames={{
                      input: reportDate
                        ? "border-2 border-success-300 dark:border-success-600"
                        : "",
                    }}
                  />

                  {/* Learning Slot is hidden - auto-filled in background from room data */}

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
                    description={
                      learningProgress
                        ? isAm
                          ? "✓ ሁኔታ ተመርጧል"
                          : "✓ Status selected"
                        : isAm
                        ? "ተማሪው በትምህርቱ ላይ ሁኔታውን ይምረጡ"
                        : "Select the student's attendance status"
                    }
                    classNames={{
                      trigger: learningProgress
                        ? "border-2 border-success-300 dark:border-success-600"
                        : "",
                      value: "text-foreground",
                    }}
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

                  {/* Show auto-filled info */}
                  {learningSlot && (
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                      <p className="text-sm text-primary-700 dark:text-primary-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        <span>
                          {isAm ? "የትምህርት ሰዓት" : "Learning Time"}:{" "}
                          <strong>{learningSlot}</strong>
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {step > 1 && (
              <Button
                variant="light"
                onPress={() => setStep(step - 1)}
                isDisabled={isCreating}
              >
                {isAm ? "ተመለስ" : "Back"}
              </Button>
            )}
            <Button
              variant="light"
              onPress={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              isDisabled={isCreating}
            >
              {isAm ? "ይቅር" : "Cancel"}
            </Button>
            {step < 3 ? (
              <Button
                color="primary"
                onPress={() => setStep(step + 1)}
                isDisabled={
                  (step === 1 && !selectedTeacher) ||
                  (step === 2 && !selectedStudent)
                }
              >
                {isAm ? "ቀጥል" : "Next"}
              </Button>
            ) : (
              <Button
                color="primary"
                onPress={handleCreateReport}
                isLoading={isCreating}
                isDisabled={!learningSlot || !reportDate || !learningProgress}
              >
                {isAm ? "ሪፖርት ይፍጠሩ" : "Create Report"}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
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
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Trash2 className="size-5 text-danger" />
              <span>{isAm ? "ሪፖርት ይሰረዝ?" : "Delete Report?"}</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {reportToDelete && (
              <div className="space-y-3">
                <p className="text-default-600">
                  {isAm
                    ? "ይህን ሪፖርት መሰረዝ እርግጠኛ ኖት? ይህ ድርጊት መልሰው ማዋቀር አይቻልም።"
                    : "Are you sure you want to delete this report? This action cannot be undone."}
                </p>
                <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="size-4 text-danger" />
                    <span className="font-semibold">
                      {reportToDelete.studentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="size-4 text-danger" />
                    <span>{reportToDelete.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-danger" />
                    <span>{reportToDelete.date}</span>
                  </div>
                </div>
                <p className="text-sm text-warning-600">
                  {isAm
                    ? "⚠️ የመማሪያ/የጎደለ ቁጥር በራስ-ሰር ይቀንሳል።"
                    : "⚠️ Learning/missing count will be automatically decremented."}
                </p>
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
