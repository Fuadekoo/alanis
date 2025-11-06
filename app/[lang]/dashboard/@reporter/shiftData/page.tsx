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
import { getAllShiftData } from "@/actions/manager/reporter";
import { Search, History, User, BookOpen, Calendar, Clock } from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";

export default function Page() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isAm = useAmharic();

  // Get shift data
  const [shiftData, isLoadingShifts, refreshShifts] = useData(
    getAllShiftData,
    () => {},
    currentPage,
    10,
    search
  );

  return (
    <div className="flex flex-col h-full overflow-hidden p-2 lg:p-5 gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="size-6" />
          {isAm ? "የመምህር ለውጥ ታሪክ" : "Teacher Shift History"}
        </h1>

        {/* Search */}
        <div className="flex gap-2 items-center">
          <Input
            placeholder={isAm ? "ፈልግ..." : "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Search className="size-4" />}
            variant="bordered"
            className="flex-1"
          />
          <div className="px-3 py-2 bg-default-50/50 rounded-lg text-center content-center font-semibold">
            {shiftData?.data?.totalCount ?? 0}
          </div>
        </div>
      </div>

      {/* Shift Data List */}
      {isLoadingShifts ? (
        <Skeleton className="w-full h-full rounded-xl" />
      ) : (
        <ScrollShadow className="p-2 pb-20 bg-default-50/50 border border-default-100/20 rounded-xl grid gap-2 auto-rows-min xl:grid-cols-2 flex-1">
          {shiftData?.success &&
          shiftData.data &&
          shiftData.data.shiftData &&
          shiftData.data.shiftData.length > 0 ? (
            shiftData.data.shiftData.map((shift, i) => (
              <Card
                key={shift.id}
                className="h-fit bg-default-50/30 backdrop-blur-sm border-2 border-default-400 hover:border-primary-400 transition-all"
              >
                <CardBody className="p-4">
                  {/* Header: Number & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {i + 1 + (currentPage - 1) * 10}
                    </div>
                    <Chip size="sm" color="warning" variant="dot">
                      {isAm ? "ታሪካዊ" : "Historical"}
                    </Chip>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-start gap-2 mb-2">
                    <User className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {highlight(
                          `${shift.student.firstName} ${shift.student.fatherName} ${shift.student.lastName}`,
                          search
                        )}
                      </div>
                      {shift.student.controller && (
                        <div className="text-xs text-default-500 mt-1">
                          {isAm ? "ተቆጣጣሪ" : "Controller"}:{" "}
                          {shift.student.controller.firstName}{" "}
                          {shift.student.controller.fatherName}{" "}
                          {shift.student.controller.lastName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-start gap-2 mb-3">
                    <BookOpen className="size-4 text-secondary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-default-700">
                        {highlight(
                          `${shift.teacher.firstName} ${shift.teacher.fatherName} ${shift.teacher.lastName}`,
                          search
                        )}
                      </div>
                      {shift.learningSlot && (
                        <div className="text-xs text-primary flex items-center gap-1 mt-1">
                          <Clock className="size-3" />
                          {shift.learningSlot}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-3">
                    <Chip color="success" size="sm" variant="flat">
                      {isAm ? "መማሪያ" : "Learning"}: {shift.learningCount}
                    </Chip>
                    <Chip color="danger" size="sm" variant="flat">
                      {isAm ? "የጠፋ" : "Missing"}: {shift.missingCount}
                    </Chip>
                    <Chip color="primary" size="sm" variant="flat">
                      {isAm ? "ጠቅላላ" : "Total"}: {shift.totalCount}
                    </Chip>
                  </div>

                  {/* Date & Payment Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-default-200">
                    <div className="flex items-center gap-1 text-xs text-default-500">
                      <Calendar className="size-3" />
                      {new Date(shift.createdAt).toLocaleDateString()}
                    </div>
                    <Chip
                      size="sm"
                      color={
                        shift.paymentStatus === "approved"
                          ? "success"
                          : shift.paymentStatus === "pending"
                          ? "warning"
                          : "danger"
                      }
                      variant="dot"
                    >
                      {shift.paymentStatus === "approved"
                        ? isAm
                          ? "ጸድቋል"
                          : "Paid"
                        : shift.paymentStatus === "pending"
                        ? isAm
                          ? "ይጠብቃል"
                          : "Pending"
                        : isAm
                        ? "ተቀባይነት አላገኘም"
                        : "Rejected"}
                    </Chip>
                  </div>

                  {/* Daily Reports Count */}
                  {shift.dailyReports && shift.dailyReports.length > 0 && (
                    <div className="mt-2 text-xs text-default-400">
                      {isAm ? "የቀን ሪፖርቶች" : "Daily Reports"}:{" "}
                      {shift.dailyReports.length}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
              <History className="size-20 text-default-300 mb-4" />
              <h3 className="text-xl font-semibold text-default-600 mb-2">
                {isAm ? "የመምህር ለውጥ ታሪክ የለም" : "No Shift History"}
              </h3>
              <p className="text-sm text-default-400 max-w-md">
                {isAm
                  ? "ገና ምንም መምህር አልተቀየረም። የክፍል ምደባዎች ሲሰረዙ የታሪክ መረጃ እዚህ ይታያል።"
                  : "No teacher shifts found. Historical data will appear here when room assignments are deleted."}
              </p>
            </div>
          )}
        </ScrollShadow>
      )}

      {/* Pagination */}
      <PaginationPlace
        currentPage={currentPage}
        totalPage={Math.ceil((shiftData?.data?.totalCount ?? 0) / 10) || 1}
        onPageChange={setCurrentPage}
        sort={false}
        onSortChange={() => {}}
        row={10}
        onRowChange={() => {}}
      />
    </div>
  );
}
