"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Skeleton,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/heroui";
import {
  getAllReports,
  getStudentsForReport,
  getTeachersForReport,
  createReport,
  updateReportStatus,
} from "@/actions/controller/report";
import { Search, Plus, Check, X, Calendar, User, BookOpen } from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";

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

  const isAm = useAmharic();

  // Get reports data
  const [reportsData, isLoadingReports] = useData(
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
    if (
      !selectedStudent ||
      !selectedTeacher ||
      !learningSlot ||
      !reportDate ||
      !learningProgress
    ) {
      alert(isAm ? "እባክዎ ሁሉንም መስኮች ይሙሉ" : "Please fill in all required fields");
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
        alert(
          isAm
            ? `ለዚህ መምህር እና ተማሪ በዚህ ቀን (${new Date(
                reportDate
              ).toLocaleDateString()}) ሪፖርት ቀድሞውኑ ተፈጥሯል። እባክዎ ሌላ ቀን ይምረጡ ወይም ያለውን ሪፖርት ያርትዑ።`
            : `A report for this teacher and student already exists on ${new Date(
                reportDate
              ).toLocaleDateString()}. Please select a different date or edit the existing report.`
        );
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
        alert(isAm ? "ሪፖርት በተሳካ ሁኔታ ተፈጥሯል!" : "Report created successfully!");
        setIsModalOpen(false);
        resetForm();
        // Refresh reports data
        window.location.reload();
      } else {
        alert(`${isAm ? "ስህተት" : "Error"}: ${result.error}`);
      }
    } catch (error) {
      alert(isAm ? "ሪፖርት መፍጠር አልተሳካም" : "Failed to create report");
    } finally {
      setIsCreating(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      const result = await updateReportStatus(reportId, "approved");
      if (result.success) {
        alert("Report approved successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to approve report");
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      const result = await updateReportStatus(reportId, "rejected");
      if (result.success) {
        alert("Report rejected successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to reject report");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isAm ? "ዕለታዊ ሪፖርት" : "Daily Reports"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isAm
                ? "ዕለታዊ ሪፖርቶችን ይፍጠሩ እና ያስተዳድሩ"
                : "Create and manage daily reports"}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="size-4" />}
            onPress={() => {
              setIsModalOpen(true);
              resetForm();
            }}
          >
            {isAm ? "አዲስ ሪፖርት" : "New Report"}
          </Button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder={isAm ? "ፈልግ..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Search className="size-4" />}
            className="flex-1"
          />
        </div>

        {/* Reports List */}
        <div>
          {isLoadingReports ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : reportsData?.success && reportsData.data ? (
            <div className="space-y-2">
              {reportsData.data.reports.map((report) => (
                <Card key={report.id}>
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="size-4 text-primary" />
                          <span className="font-semibold">
                            {highlight(
                              `${report.student.firstName} ${report.student.lastName}`,
                              search
                            )}
                          </span>
                          <span className="text-sm text-default-500">
                            (@{report.student.username})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="size-4 text-secondary" />
                          <span className="text-sm">
                            {highlight(
                              `${report.activeTeacher.firstName} ${report.activeTeacher.lastName}`,
                              search
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-default-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(report.date).toLocaleDateString()}
                          </div>
                          <span>Slot: {report.learningSlot}</span>
                          <Chip
                            color={
                              report.learningProgress === "present"
                                ? "success"
                                : report.learningProgress === "permission"
                                ? "primary"
                                : "warning"
                            }
                            size="sm"
                          >
                            {report.learningProgress}
                          </Chip>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<Check className="size-3" />}
                          onPress={() => handleApproveReport(report.id)}
                        >
                          {isAm ? "ይፀድቅ" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          startContent={<X className="size-3" />}
                          onPress={() => handleRejectReport(report.id)}
                        >
                          {isAm ? "ይተው" : "Reject"}
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}

              {reportsData.data?.reports.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-default-500">
                    {isAm ? "ምንም ሪፖርት አልተገኘም" : "No reports found"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-danger">
                {isAm ? "ሪፖርቶችን ማግኘት አልተቻለም" : "Failed to load reports"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {reportsData?.success &&
            reportsData.data &&
            reportsData.data.totalPages > 1 && (
              <div className="mt-4">
                <PaginationPlace
                  currentPage={currentPage}
                  totalPage={reportsData.data.totalPages}
                  onPageChange={setCurrentPage}
                  sort={false}
                  onSortChange={() => {}}
                  row={10}
                  onRowChange={() => {}}
                />
              </div>
            )}
        </div>
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
                <Select
                  placeholder={isAm ? "መምህር ይምረጡ" : "Select Teacher"}
                  selectedKeys={selectedTeacher ? [selectedTeacher] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedTeacher(selected);
                  }}
                  isLoading={isLoadingTeachers}
                  label={isAm ? "መምህር" : "Teacher"}
                  classNames={{
                    trigger: selectedTeacher
                      ? "border-2 border-blue-300 dark:border-blue-600"
                      : "",
                  }}
                >
                  {(teachersData?.data || []).map((teacher) => (
                    <SelectItem key={teacher.id}>
                      {teacher.firstName} {teacher.lastName} (@
                      {teacher.username})
                    </SelectItem>
                  ))}
                </Select>
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
                <Select
                  placeholder={isAm ? "ተማሪ ይምረጡ" : "Select Student"}
                  selectedKeys={selectedStudent ? [selectedStudent] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedStudent(selected);

                    // Auto-fill learning slot from student's room data
                    const studentData = studentsData?.data?.find(
                      (student: any) => student.id === selected
                    );
                    if (
                      studentData &&
                      (studentData as any).roomStudent &&
                      (studentData as any).roomStudent.length > 0
                    ) {
                      const roomTime = (studentData as any).roomStudent[0].time;
                      setLearningSlot(roomTime || "");
                    } else {
                      setLearningSlot("");
                    }
                  }}
                  isLoading={isLoadingStudents}
                  label={isAm ? "ተማሪ" : "Student"}
                  classNames={{
                    trigger: selectedStudent
                      ? "border-2 border-blue-300 dark:border-blue-600"
                      : "",
                  }}
                >
                  {(studentsData?.data || []).map((student: any) => (
                    <SelectItem key={student.id}>
                      <div className="flex flex-col">
                        <span>
                          {student.firstName} {student.lastName} (@
                          {student.username})
                        </span>
                        {student.roomStudent &&
                          student.roomStudent.length > 0 && (
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              {isAm ? "ሰዓት" : "Time"}:{" "}
                              {student.roomStudent[0].time}
                            </span>
                          )}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
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
                    description={
                      isAm
                        ? "ሪፖርቱ የተሰራበትን ቀን ይምረጡ"
                        : "Select the date for this report"
                    }
                    classNames={{
                      input: reportDate
                        ? "border-2 border-blue-300 dark:border-blue-600"
                        : "",
                    }}
                  />

                  <Input
                    label={isAm ? "የትምህርት ሰላት" : "Learning Slot"}
                    placeholder={
                      isAm ? "የትምህርት ሰላት ያስገቡ" : "Enter learning slot"
                    }
                    value={learningSlot}
                    onChange={(e) => setLearningSlot(e.target.value)}
                    description={
                      learningSlot
                        ? isAm
                          ? "ሰዓቱ ራሱን ችሎ ተሞልቷል"
                          : "Auto-filled from student's schedule"
                        : ""
                    }
                    classNames={{
                      input: learningSlot
                        ? "border-2 border-green-300 dark:border-green-600"
                        : "",
                    }}
                  />

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
                      isAm
                        ? "ተማሪው በትምህርቱ ላይ ሁኔታውን ይምረጡ"
                        : "Select the student's attendance status"
                    }
                    classNames={{
                      trigger: learningProgress
                        ? "border-2 border-blue-300 dark:border-blue-600"
                        : "",
                    }}
                  >
                    <SelectItem key="present">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>{isAm ? "ተገኝቷል" : "Present"}</span>
                      </div>
                    </SelectItem>
                    <SelectItem key="absent">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>{isAm ? "ጠፍቷል" : "Absent"}</span>
                      </div>
                    </SelectItem>
                    <SelectItem key="permission">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>{isAm ? "ፈቃድ" : "Permission"}</span>
                      </div>
                    </SelectItem>
                  </Select>
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
    </div>
  );
}
