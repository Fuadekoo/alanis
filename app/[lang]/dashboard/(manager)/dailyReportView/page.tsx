"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Input,
  Skeleton,
  Chip,
  ScrollShadow,
} from "@/components/ui/heroui";
import { getAllReports } from "@/actions/controller/report";
import { Search, Calendar, User, BookOpen, FileText } from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";

export default function Page() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isAm = useAmharic();

  // Get reports data
  const [reportsData, isLoadingReports] = useData(
    getAllReports,
    () => {},
    currentPage,
    10,
    search
  );

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
    </div>
  );
}
