"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Skeleton,
  Chip,
  ScrollShadow,
} from "@/components/ui/heroui";
import {
  getAllTeachersForReporter,
  getTeacherProgressByTeacher,
} from "@/actions/manager/reporter";
import {
  Search,
  User,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";
import useData from "@/hooks/useData";
import { highlight } from "@/lib/utils";
import useAmharic from "@/hooks/useAmharic";

export default function Page() {
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  } | null>(null);

  const isAm = useAmharic();

  // Get all teachers
  const [teachersData, isLoadingTeachers] = useData(
    getAllTeachersForReporter,
    () => {}
  );

  // Get teacher progress when teacher is selected
  const [progressData, isLoadingProgress] = useData(
    getTeacherProgressByTeacher,
    () => {},
    selectedTeacher?.id || ""
  );

  // Filter teachers based on search
  const filteredTeachers = React.useMemo(() => {
    if (!teachersData?.data) return [];
    if (!search) return teachersData.data;

    return teachersData.data.filter(
      (teacher: {
        firstName: string;
        fatherName: string;
        lastName: string;
      }) => {
        const searchLower = search.toLowerCase();
        return (
          teacher.firstName.toLowerCase().includes(searchLower) ||
          teacher.fatherName.toLowerCase().includes(searchLower) ||
          teacher.lastName.toLowerCase().includes(searchLower)
        );
      }
    );
  }, [teachersData?.data, search]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-2 lg:p-5 gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="size-6" />
            {isAm ? "የመምህር ሂደት" : "Teacher Progress"}
          </h1>
          {selectedTeacher && (
            <Button
              variant="light"
              onPress={() => setSelectedTeacher(null)}
              size="sm"
            >
              {isAm ? "← ወደ መምህራን ዝርዝር" : "← Back to Teachers"}
            </Button>
          )}
        </div>

        {/* Search - Only show when viewing teacher list */}
        {!selectedTeacher && (
          <div className="flex gap-2 items-center">
            <Input
              placeholder={isAm ? "መምህር ይፈልጉ..." : "Search teachers..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search className="size-4" />}
              variant="bordered"
              className="flex-1"
            />
            <div className="px-3 py-2 bg-default-50/50 rounded-lg text-center content-center font-semibold">
              {filteredTeachers.length}
            </div>
          </div>
        )}
      </div>

      {/* Teacher List View */}
      {!selectedTeacher && (
        <ScrollShadow className="p-2 pb-20 bg-default-50/50 border border-default-100/20 rounded-xl grid gap-2 auto-rows-min xl:grid-cols-3 flex-1">
          {isLoadingTeachers ? (
            <>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </>
          ) : filteredTeachers.length > 0 ? (
            filteredTeachers.map(
              (teacher: {
                id: string;
                firstName: string;
                fatherName: string;
                lastName: string;
                _count: { teacherProgressAsTeacher: number };
              }) => (
                <Card
                  key={teacher.id}
                  isPressable
                  onPress={() =>
                    setSelectedTeacher({
                      id: teacher.id,
                      firstName: teacher.firstName,
                      fatherName: teacher.fatherName,
                      lastName: teacher.lastName,
                    })
                  }
                  className="h-fit bg-default-50/30 backdrop-blur-sm border-2 border-default-400 hover:border-primary-400 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1">
                          {highlight(
                            `${teacher.firstName} ${teacher.fatherName} ${teacher.lastName}`,
                            search
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="primary" variant="flat">
                            {teacher._count.teacherProgressAsTeacher}{" "}
                            {isAm ? "ተማሪዎች" : "Students"}
                          </Chip>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )
            )
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="size-20 text-default-300 mb-4" />
              <h3 className="text-xl font-semibold text-default-600 mb-2">
                {isAm ? "ምንም መምህር አልተገኘም" : "No Teachers Found"}
              </h3>
              <p className="text-sm text-default-400 max-w-md">
                {isAm ? "የፍለጋ መስፈርቶችዎን ያስተካክሉ" : "Adjust your search criteria"}
              </p>
            </div>
          )}
        </ScrollShadow>
      )}

      {/* Teacher Progress Table View */}
      {selectedTeacher && (
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="flex flex-col items-start p-4 border-b border-default-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="size-5 text-primary" />
              <h2 className="text-xl font-bold">
                {selectedTeacher.firstName} {selectedTeacher.fatherName}{" "}
                {selectedTeacher.lastName}
              </h2>
            </div>
            <p className="text-sm text-default-500">
              {isAm ? "የአሁን የማስተማሪያ ሂደቶች" : "Current Teaching Progress"}
            </p>
          </CardHeader>

          <CardBody className="p-0 overflow-auto">
            {isLoadingProgress ? (
              <div className="p-4">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>
            ) : progressData?.success && progressData.data ? (
              progressData.data.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-default-100 z-10">
                      <tr>
                        <th className="border border-default-200 p-3 text-left font-semibold">
                          #
                        </th>
                        <th className="border border-default-200 p-3 text-left font-semibold min-w-[200px]">
                          {isAm ? "ተማሪ" : "Student"}
                        </th>
                        <th className="border border-default-200 p-3 text-left font-semibold min-w-[150px]">
                          {isAm ? "ተቆጣጣሪ" : "Controller"}
                        </th>
                        <th className="border border-default-200 p-3 text-center font-semibold">
                          {isAm ? "የትምህርት ሰዓት" : "Learning Slot"}
                        </th>
                        <th className="border border-default-200 p-3 text-center font-semibold">
                          {isAm ? "መማሪያ" : "Learning"}
                        </th>
                        <th className="border border-default-200 p-3 text-center font-semibold">
                          {isAm ? "የጠፋ" : "Missing"}
                        </th>
                        <th className="border border-default-200 p-3 text-center font-semibold">
                          {isAm ? "ጠቅላላ" : "Total"}
                        </th>
                        <th className="border border-default-200 p-3 text-center font-semibold">
                          {isAm ? "ሁኔታ" : "Status"}
                        </th>
                        <th className="border border-default-200 p-3 text-center font-semibold">
                          {isAm ? "ክፍያ" : "Payment"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressData.data.map((progress, idx) => (
                        <tr key={progress.id} className="hover:bg-default-50">
                          <td className="border border-default-200 p-3 text-center">
                            {idx + 1}
                          </td>
                          <td className="border border-default-200 p-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {progress.student.firstName}{" "}
                                {progress.student.fatherName}{" "}
                                {progress.student.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="border border-default-200 p-3">
                            {progress.student.controller ? (
                              <span className="text-sm">
                                {progress.student.controller.firstName}{" "}
                                {progress.student.controller.fatherName}{" "}
                                {progress.student.controller.lastName}
                              </span>
                            ) : (
                              <span className="text-default-400 text-xs">
                                {isAm ? "የለም" : "None"}
                              </span>
                            )}
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            {progress.learningSlot ? (
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <Clock className="size-3 text-primary" />
                                {progress.learningSlot}
                              </div>
                            ) : (
                              <span className="text-default-400">-</span>
                            )}
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip color="success" size="sm" variant="flat">
                              {progress.learningCount}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip color="danger" size="sm" variant="flat">
                              {progress.missingCount}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip color="primary" size="sm" variant="flat">
                              {progress.totalCount}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip
                              size="sm"
                              color={
                                progress.progressStatus === "open"
                                  ? "success"
                                  : "default"
                              }
                              variant="dot"
                            >
                              {progress.progressStatus === "open"
                                ? isAm
                                  ? "ክፍት"
                                  : "Open"
                                : isAm
                                ? "ዝግ"
                                : "Closed"}
                            </Chip>
                          </td>
                          <td className="border border-default-200 p-3 text-center">
                            <Chip
                              size="sm"
                              color={
                                progress.paymentStatus === "approved"
                                  ? "success"
                                  : progress.paymentStatus === "pending"
                                  ? "warning"
                                  : "danger"
                              }
                              variant="dot"
                            >
                              {progress.paymentStatus === "approved"
                                ? isAm
                                  ? "ጸድቋል"
                                  : "Paid"
                                : progress.paymentStatus === "pending"
                                ? isAm
                                  ? "ይጠብቃል"
                                  : "Pending"
                                : isAm
                                ? "ተቀባይነት አላገኘም"
                                : "Rejected"}
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-default-500">
                  <BookOpen className="size-20 text-default-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-default-600 mb-2">
                    {isAm ? "ምንም የማስተማሪያ ሂደት የለም" : "No Teaching Progress"}
                  </h3>
                  <p className="text-sm text-default-400">
                    {isAm
                      ? "ይህ መምህር ለአሁኑ ከማንም ተማሪ ጋር የማስተማሪያ ሂደት የለውም።"
                      : "This teacher currently has no active teaching progress with any students."}
                  </p>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-danger">
                {isAm ? "መረጃ ማግኘት አልተሳካም" : "Failed to load data"}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
