"use client";

import React, { useState, useMemo } from "react";
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
  ScrollShadow,
} from "@/components/ui/heroui";
import {
  getTeacherMonthlyCalendar,
  getTeachersWithControllers,
} from "@/actions/manager/reporter";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

export default function Page() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();

  // Get teachers with controllers
  const [teachersData, isLoadingTeachers] = useData(
    getTeachersWithControllers,
    () => {}
  );

  // Get calendar data when teacher is selected
  const [calendarData, isLoadingCalendar, refreshCalendar] = useData(
    getTeacherMonthlyCalendar,
    () => {},
    selectedTeacher || "",
    year,
    month
  );

  // Helper functions for month navigation
  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Get month name
  const getMonthName = (monthNum: number) => {
    const monthNames = isAm
      ? [
          "መስከረም",
          "ጥቅምት",
          "ህዳር",
          "ታህሳስ",
          "ጥር",
          "የካቲት",
          "መጋቢት",
          "ሚያዝያ",
          "ግንቦት",
          "ሰኔ",
          "ሐምሌ",
          "ነሐሴ",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
    return monthNames[monthNum - 1];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-2 lg:p-5 gap-4">
      {/* Header with Teacher Selection */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="size-6" />
          {isAm ? "የወር ሪፖርት አቀራረብ" : "Monthly Report View"}
        </h1>

        {/* Teacher Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Autocomplete
            label={isAm ? "መምህር ይምረጡ" : "Select Teacher"}
            placeholder={isAm ? "መምህር ይፈልጉ..." : "Search for teacher..."}
            selectedKey={selectedTeacher || null}
            onSelectionChange={(key: React.Key | null) => {
              setSelectedTeacher((key as string) || "");
            }}
            defaultItems={teachersData?.data || []}
            variant="bordered"
            isClearable
            isLoading={isLoadingTeachers}
            listboxProps={{
              emptyContent: isAm ? "ምንም መምህር አልተገኘም" : "No teachers found",
            }}
            description={
              selectedTeacher
                ? isAm
                  ? "✓ መምህር ተመርጧል"
                  : "✓ Teacher selected"
                : isAm
                ? "ለመፈለግ መታየብ ይጀምሩ"
                : "Start typing to search"
            }
            classNames={{
              base: selectedTeacher
                ? "border-2 border-success-300 dark:border-success-600 rounded-lg"
                : "",
            }}
          >
            {(item: {
              teacher: {
                id: string;
                firstName: string;
                fatherName: string;
                lastName: string;
              };
              controller: {
                firstName: string;
                fatherName: string;
                lastName: string;
              } | null;
            }) => (
              <AutocompleteItem
                key={item.teacher.id}
                textValue={`${item.teacher.firstName} ${item.teacher.fatherName} ${item.teacher.lastName}`}
              >
                <div className="flex flex-col py-1">
                  <span className="font-medium">
                    {item.teacher.firstName} {item.teacher.fatherName}{" "}
                    {item.teacher.lastName}
                  </span>
                  {item.controller && (
                    <span className="text-xs text-primary mt-1">
                      {isAm ? "ተቆጣጣሪ" : "Controller"}:{" "}
                      {item.controller.firstName} {item.controller.fatherName}{" "}
                      {item.controller.lastName}
                    </span>
                  )}
                </div>
              </AutocompleteItem>
            )}
          </Autocomplete>
        </div>
      </div>

      {/* Month/Year Navigation and Calendar */}
      {selectedTeacher && (
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-default-200">
            <Button
              isIconOnly
              variant="light"
              onPress={handlePreviousMonth}
              size="sm"
            >
              <ChevronLeft className="size-5" />
            </Button>

            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">
                {getMonthName(month)} {year}
              </h2>
            </div>

            <Button
              isIconOnly
              variant="light"
              onPress={handleNextMonth}
              size="sm"
            >
              <ChevronRight className="size-5" />
            </Button>
          </CardHeader>

          <CardBody className="p-0 overflow-auto">
            {isLoadingCalendar ? (
              <div className="p-4">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>
            ) : calendarData?.success && calendarData.data ? (
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-default-100 z-10">
                    <tr>
                      <th className="border border-default-200 p-2 text-left font-semibold min-w-[150px] sticky left-0 bg-default-100 z-20">
                        {isAm ? "ተማሪ" : "Student"}
                      </th>
                      {Array.from(
                        { length: calendarData.data.daysInMonth },
                        (_, i) => i + 1
                      ).map((day) => (
                        <th
                          key={day}
                          className="border border-default-200 p-1 text-center font-semibold min-w-[50px] text-xs"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarData.data.calendarData.length > 0 ? (
                      calendarData.data.calendarData.map((item, idx) => (
                        <tr
                          key={item.student.id}
                          className="hover:bg-default-50"
                        >
                          <td className="border border-default-200 p-2 font-medium sticky left-0 bg-white dark:bg-default-50 z-10">
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {item.student.firstName}{" "}
                                {item.student.fatherName}{" "}
                                {item.student.lastName}
                              </span>
                            </div>
                          </td>
                          {Array.from(
                            { length: calendarData.data.daysInMonth },
                            (_, i) => i + 1
                          ).map((day) => {
                            const report = item.reportsByDate[day];
                            return (
                              <td
                                key={day}
                                className="border border-default-200 p-1 text-center"
                              >
                                {report ? (
                                  <div className="flex items-center justify-center">
                                    <Chip
                                      size="sm"
                                      color={
                                        report.learningProgress === "present"
                                          ? "success"
                                          : report.learningProgress ===
                                            "permission"
                                          ? "primary"
                                          : "danger"
                                      }
                                      variant="flat"
                                      className="text-[10px] h-5 min-w-[45px]"
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
                                  </div>
                                ) : (
                                  <span className="text-default-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={calendarData.data.daysInMonth + 1}
                          className="border border-default-200 p-8 text-center text-default-500"
                        >
                          {isAm
                            ? "ለዚህ መምህር ምንም ተማሪዎች አልተገኙም"
                            : "No students found for this teacher"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-default-500">
                {isAm ? "መረጃ ማግኘት አልተሳካም" : "Failed to load data"}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Instructions when no teacher selected */}
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
                  ? "የወር ሪፖርት አቀራረብን ለማየት ከላይ ያለውን ተወላጅ መምህር ይምረጡ። ሪፖርቶች በቀን እና ተማሪ የተደራጁ ይታያሉ።"
                  : "Select a teacher from above to view their monthly report calendar. Reports will be organized by day and student."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

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
