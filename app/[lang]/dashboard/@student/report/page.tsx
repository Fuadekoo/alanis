"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Skeleton,
  Chip,
  ScrollShadow,
} from "@/components/ui/heroui";
import {
  getReportByStudent,
  studentApproveReport,
} from "@/actions/controller/report";
import { Search, Check, X, Calendar, BookOpen, FileText } from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";
import { useSession } from "next-auth/react";

export default function Page() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();
  const { data: session } = useSession();

  // Get student's own reports
  const [reportsData, isLoadingReports, refreshReports] = useData(
    getReportByStudent,
    () => {},
    session?.user?.id || "",
    currentPage,
    10,
    search
  );

  const handleApproveReport = async (reportId: string) => {
    try {
      const result = await studentApproveReport(reportId, true);
      if (result.success) {
        if (refreshReports) {
          refreshReports();
        }
        showAlert({
          message: isAm
            ? "ሪፖርት በተሳካ ሁኔታ ጸድቋል!"
            : "Report approved successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
      } else {
        showAlert({
          message:
            result.error ||
            (isAm ? "ሪፖርት ማጽደቅ አልተሳካም" : "Failed to approve report"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch {
      showAlert({
        message: isAm ? "ሪፖርት ማጽደቅ አልተሳካም" : "Failed to approve report",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      const result = await studentApproveReport(reportId, false);
      if (result.success) {
        if (refreshReports) {
          refreshReports();
        }
        showAlert({
          message: isAm
            ? "ሪፖርት በተሳካ ሁኔታ ተቀባይነት አላገኘም!"
            : "Report rejected successfully!",
          type: "success",
          title: isAm ? "ተሳክቷል" : "Success",
        });
      } else {
        showAlert({
          message:
            result.error ||
            (isAm ? "ሪፖርት መቃወም አልተሳካም" : "Failed to reject report"),
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    } catch {
      showAlert({
        message: isAm ? "ሪፖርት መቃወም አልተሳካም" : "Failed to reject report",
        type: "error",
        title: isAm ? "ስህተት" : "Error",
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Content */}
      <div className="p-2 lg:p-5 grid grid-rows-[auto_1fr_auto] gap-5 overflow-hidden">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder={isAm ? "የመምህር ስም ፈልግ..." : "Search teacher name..."}
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
                    {/* Line 1: Teacher & Date */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {i + 1 + (currentPage - 1) * 10}
                      </div>
                      <BookOpen className="size-3 text-primary shrink-0" />
                      <span className="font-semibold text-sm">
                        {highlight(
                          `${report.activeTeacher.firstName} ${report.activeTeacher.lastName}`,
                          search
                        )}
                      </span>
                      <Calendar className="size-3 text-secondary shrink-0 ml-auto" />
                      <span className="text-xs text-default-600">
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Line 2: Slot, Status & Actions */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-default-600">
                        {report.learningSlot}
                      </span>
                      <span className="text-default-400">•</span>
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
                      {report.studentApproved !== null && (
                        <Chip
                          size="sm"
                          color={report.studentApproved ? "success" : "danger"}
                          variant="flat"
                          className="h-5"
                        >
                          {report.studentApproved
                            ? isAm
                              ? "ጸድቋል"
                              : "Approved"
                            : isAm
                            ? "ተቀባይነት አላገኘም"
                            : "Rejected"}
                        </Chip>
                      )}
                      <Button
                        size="sm"
                        color="success"
                        variant="light"
                        isIconOnly
                        className="h-6 w-6 min-w-6 ml-auto"
                        onPress={() => handleApproveReport(report.id)}
                        isDisabled={report.studentApproved !== null}
                      >
                        <Check className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        isIconOnly
                        className="h-6 w-6 min-w-6"
                        onPress={() => handleRejectReport(report.id)}
                        isDisabled={report.studentApproved !== null}
                      >
                        <X className="size-3" />
                      </Button>
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
                    ? "ገና ምንም ዕለታዊ ሪፖርት የለዎትም። መምህርዎ ሪፖርቶችን ሲፈጥሩ እዚህ ይታያሉ።"
                    : "You don't have any daily reports yet. When your teacher creates reports, they will appear here."}
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
