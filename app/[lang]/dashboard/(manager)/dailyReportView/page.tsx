"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Skeleton,
  Chip,
  ScrollShadow,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/heroui";
import { getAllReports, deleteReport } from "@/actions/controller/report";
import {
  Search,
  Calendar,
  User,
  BookOpen,
  FileText,
  Trash2,
} from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

export default function Page() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  const handleDeleteClick = (report: {
    id: string;
    student: { firstName: string; lastName: string };
    activeTeacher: { firstName: string; lastName: string };
    date: string | Date;
    teacherProgress: { progressStatus: string } | null;
  }) => {
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
    } catch (error) {
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
            className="flex-1"
          />
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
                      {/* Delete Button - Only show if progress is open */}
                      {report.teacherProgress?.progressStatus === "open" && (
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
                      report.studentApproved !== undefined ? (
                        <Chip
                          size="sm"
                          color={report.studentApproved ? "success" : "danger"}
                          variant="flat"
                          className="h-5 ml-auto"
                        >
                          {report.studentApproved
                            ? isAm
                              ? "ተማሪ ✓"
                              : "Student ✓"
                            : isAm
                            ? "ተማሪ ✗"
                            : "Student ✗"}
                        </Chip>
                      ) : (
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
                <FileText className="size-20 text-default-300 mb-4" />
                <h3 className="text-xl font-semibold text-default-600 mb-2">
                  {isAm ? "ምንም ሪፖርት አልተገኘም" : "No Reports Found"}
                </h3>
                <p className="text-sm text-default-400 max-w-md">
                  {isAm
                    ? "ገና ምንም ዕለታዊ ሪፖርት አልተፈጠረም።"
                    : "No daily reports have been created yet."}
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
