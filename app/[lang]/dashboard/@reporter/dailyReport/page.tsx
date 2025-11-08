"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectItem,
  Pagination,
} from "@/components/ui/heroui";
import {
  getTeacherMonthlyCalendar,
  getTeachersWithControllers,
} from "@/actions/manager/reporter";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";

export default function Page() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const filteredCalendarData = useMemo(() => {
    if (!calendarData?.success || !calendarData.data) return [];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return calendarData.data.calendarData;
    }
    return calendarData.data.calendarData.filter((item) => {
      const studentName =
        `${item.student.firstName} ${item.student.fatherName} ${item.student.lastName}`
          .toLowerCase()
          .trim();
      return studentName.includes(normalized);
    });
  }, [calendarData, searchTerm]);

  const daysInMonth = calendarData?.data?.daysInMonth ?? 0;
  const totalStudents = filteredCalendarData.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));

  useEffect(() => {
    setPage(1);
  }, [selectedTeacher, month, year, searchTerm, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedCalendarData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCalendarData.slice(start, start + pageSize);
  }, [filteredCalendarData, page, pageSize]);

  const pageSizeOptions = useMemo(
    () => [10, 25, 50, 100].map((value) => value.toString()),
    []
  );

  const paginationInfo = useMemo(() => {
    if (totalStudents === 0) {
      return { start: 0, end: 0 };
    }
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
          <CardHeader className="flex flex-col gap-4 p-4 border-b border-default-200">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  variant="light"
                  onPress={handlePreviousMonth}
                  size="sm"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <h2 className="text-xl font-bold whitespace-nowrap">
                  {getMonthName(month)} {year}
                </h2>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={handleNextMonth}
                  size="sm"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full lg:w-auto">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isAm
                      ? "ተማሪን በፍጥነት ለመፈለግ ይጻፉ..."
                      : "Quick search for a student..."
                  }
                  variant="bordered"
                  startContent={<Search className="size-4 text-default-400" />}
                  className="w-full lg:w-72"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:gap-3 gap-3 w-full lg:w-auto">
                  <Select
                    label={isAm ? "ወር ይምረጡ" : "Select Month"}
                    selectedKeys={new Set([month.toString()])}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      if (value) setMonth(parseInt(value));
                    }}
                    variant="bordered"
                    className="min-w-[160px]"
                  >
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value}>{option.label}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label={isAm ? "ዓመት ይምረጡ" : "Select Year"}
                    selectedKeys={new Set([year.toString()])}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      if (value) setYear(parseInt(value));
                    }}
                    variant="bordered"
                    className="min-w-[160px]"
                  >
                    {yearOptions.map((option) => (
                      <SelectItem key={option.value}>{option.label}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label={isAm ? "በገጹ ቁጥር" : "Rows per page"}
                    selectedKeys={new Set([pageSize.toString()])}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      if (value) setPageSize(parseInt(value));
                    }}
                    variant="bordered"
                    className="min-w-[160px]"
                  >
                    {pageSizeOptions.map((value) => (
                      <SelectItem key={value}>{value}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-0 overflow-auto">
            {isLoadingCalendar ? (
              <div className="p-4">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>
            ) : calendarData?.success && calendarData.data ? (
              <div className="flex flex-col gap-3">
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-default-100 z-10">
                      <tr>
                        <th className="border border-default-200 p-2 text-left font-semibold min-w-[150px] sticky left-0 bg-default-100 z-20">
                          {isAm ? "ተማሪ" : "Student"}
                        </th>
                        {Array.from(
                          { length: daysInMonth },
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
                      {paginatedCalendarData.length > 0 ? (
                        paginatedCalendarData.map((item) => (
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
                              { length: daysInMonth },
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
                            colSpan={daysInMonth + 1 || 2}
                            className="border border-default-200 p-8 text-center text-default-500"
                          >
                            {searchTerm.trim().length > 0
                              ? isAm
                                ? "ተማሪ አልተገኘም። እባክዎ የፍለጋ ቃልን ይለውጡ።"
                                : "No students match your search. Try a different keyword."
                              : isAm
                              ? "ለዚህ መምህር ምንም ተማሪዎች አልተገኙም"
                              : "No students found for this teacher"}
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
