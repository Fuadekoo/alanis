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
  const [step, setStep] = useState(1); // 1: Select Teacher, 2: Select Student, 3: Fill Details
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [learningSlot, setLearningSlot] = useState("");
  const [learningProgress, setLearningProgress] = useState<
    "present" | "absent" | "permission"
  >("present");
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

  const handleCreateReport = async () => {
    if (!selectedStudent || !selectedTeacher || !learningSlot) {
      alert("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createReport({
        studentId: selectedStudent,
        activeTeacherId: selectedTeacher,
        learningSlot,
        learningProgress,
      });

      if (result.success) {
        alert("Report created successfully!");
        setStep(0);
        setSelectedStudent("");
        setSelectedTeacher("");
        setLearningSlot("");
        setLearningProgress("present");
        // Refresh reports data
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to create report");
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
    <div className="grid gap-4 grid-rows-[auto_1fr] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isAm ? "ዕለታዊ ሪፖርት" : "Daily Reports"}
        </h1>
        <Button
          color="primary"
          startContent={<Plus className="size-4" />}
          onPress={() => setStep(1)}
        >
          {isAm ? "አዲስ ሪፖርት" : "New Report"}
        </Button>
      </div>

      {/* Step Indicator */}
      {step > 0 && (
        <div className="flex items-center gap-2 p-4 bg-default-50 rounded-lg">
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
            {isAm ? "መምህር ይምረጡ" : "Select Teacher"}
          </span>
          <div className="w-8 h-0.5 bg-default-200"></div>
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
            {isAm ? "ተማሪ ይምረጡ" : "Select Student"}
          </span>
          <div className="w-8 h-0.5 bg-default-200"></div>
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
            {isAm ? "ዝርዝሮች ይሙሉ" : "Fill Details"}
          </span>
        </div>
      )}

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

      {/* Step 1: Select Teacher */}
      {step === 1 && (
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isAm ? "መምህር ይምረጡ" : "Step 1: Select Teacher"}
            </h2>
            <p className="text-sm text-default-500">
              {isAm
                ? "ሪፖርት ለመፍጠር መምህር ይምረጡ"
                : "Choose a teacher to create a report for"}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              placeholder={isAm ? "መምህር ይምረጡ" : "Select Teacher"}
              selectedKeys={selectedTeacher ? [selectedTeacher] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedTeacher(selected);
              }}
              isLoading={isLoadingTeachers}
              className="w-full"
            >
              {teachersData?.data?.map((teacher) => (
                <SelectItem key={teacher.id}>
                  {teacher.firstName} {teacher.lastName} (@{teacher.username})
                </SelectItem>
              )) || []}
            </Select>

            <div className="flex gap-2 justify-end">
              <Button variant="light" onPress={() => setStep(0)}>
                {isAm ? "ይቅር" : "Cancel"}
              </Button>
              <Button
                color="primary"
                onPress={() => setStep(2)}
                isDisabled={!selectedTeacher}
              >
                {isAm ? "ቀጥል" : "Next"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Select Student */}
      {step === 2 && (
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isAm ? "ተማሪ ይምረጡ" : "Step 2: Select Student"}
            </h2>
            <p className="text-sm text-default-500">
              {isAm
                ? "ሪፖርት የሚፈጠርለት ተማሪ ይምረጡ"
                : "Choose the student for this report"}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              placeholder={isAm ? "ተማሪ ይምረጡ" : "Select Student"}
              selectedKeys={selectedStudent ? [selectedStudent] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedStudent(selected);
              }}
              isLoading={isLoadingStudents}
              className="w-full"
            >
              {studentsData?.data?.map((student) => (
                <SelectItem key={student.id}>
                  {student.firstName} {student.lastName} (@{student.username})
                </SelectItem>
              )) || []}
            </Select>

            <div className="flex gap-2 justify-between">
              <Button variant="light" onPress={() => setStep(1)}>
                {isAm ? "ተመለስ" : "Back"}
              </Button>
              <Button
                color="primary"
                onPress={() => setStep(3)}
                isDisabled={!selectedStudent}
              >
                {isAm ? "ቀጥል" : "Next"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 3: Fill Details */}
      {step === 3 && (
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isAm ? "ዝርዝሮች ይሙሉ" : "Step 3: Fill Details"}
            </h2>
            <p className="text-sm text-default-500">
              {isAm ? "ሪፖርቱን ለመጠናቀቅ ዝርዝሮች ይሙሉ" : "Complete the report details"}
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder={isAm ? "የትምህርት ሰላት" : "Learning Slot"}
                value={learningSlot}
                onChange={(e) => setLearningSlot(e.target.value)}
              />

              <Select
                placeholder={isAm ? "የትምህርት ሁኔታ" : "Learning Status"}
                selectedKeys={[learningProgress]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as
                    | "present"
                    | "absent"
                    | "permission";
                  setLearningProgress(selected);
                }}
              >
                <SelectItem key="present">
                  {isAm ? "ተገኝቷል" : "Present"}
                </SelectItem>
                <SelectItem key="absent">{isAm ? "ጠፍቷል" : "Absent"}</SelectItem>
                <SelectItem key="permission">
                  {isAm ? "ፈቃድ" : "Permission"}
                </SelectItem>
              </Select>
            </div>

            <div className="flex gap-2 justify-between">
              <Button variant="light" onPress={() => setStep(2)}>
                {isAm ? "ተመለስ" : "Back"}
              </Button>
              <Button
                color="primary"
                onPress={handleCreateReport}
                isLoading={isCreating}
                isDisabled={!learningSlot}
              >
                {isAm ? "ሪፖርት ይፍጠሩ" : "Create Report"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Reports List */}
      <div className="overflow-hidden">
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
  );
}
