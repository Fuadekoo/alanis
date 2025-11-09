"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Skeleton,
  Chip,
} from "@/components/ui/heroui";
import {
  BarChart2,
  ChartBarStacked,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import useData from "@/hooks/useData";
import useAmharic from "@/hooks/useAmharic";
import useAlert from "@/hooks/useAlert";
import CustomAlert from "@/components/customAlert";
import { getReporterAnalytics } from "@/actions/reporter/dashboard";

interface AnalyticsCards {
  totalReports: number;
  totalAbsent: number;
  totalPresent: number;
  totalPermission: number;
  totalShifts: number;
  teacherCount: number;
  approvalRate: number;
}

interface MonthlySummary {
  month: number;
  label: string;
  total: number;
  present: number;
  absent: number;
  permission: number;
}

interface TeacherSummary {
  teacherId: string;
  teacherName: string;
  total: number;
  absent: number;
}

export default function Page() {
  const isAm = useAmharic();
  const { isAlertOpen, alertOptions, showAlert, closeAlert } = useAlert();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [analytics, isLoadingAnalytics] = useData(
    getReporterAnalytics,
    ({ success, data }) => {
      if (!success || !data) {
        showAlert({
          message: isAm ? "መረጃ ማግኘት አልተሳካም" : "Failed to load analytics",
          type: "error",
          title: isAm ? "ስህተት" : "Error",
        });
      }
    },
    selectedYear
  );

  const totals: AnalyticsCards | undefined = analytics?.data?.totals;
  const monthly: MonthlySummary[] = analytics?.data?.monthly ?? [];
  const topTeachers: TeacherSummary[] = analytics?.data?.topTeachers ?? [];

  const cards = useMemo(() => {
    if (!totals) return [];
    return [
      {
        title: isAm ? "ጠቅላላ ሪፖርቶች" : "Total Reports",
        value: totals.totalReports,
        icon: <BarChart2 className="size-5 text-primary" />,
        accent: "bg-primary/10",
      },
      {
        title: isAm ? "የተጠፉ ቀናት" : "Missing Days",
        value: totals.totalAbsent,
        icon: <AlertTriangle className="size-5 text-danger" />,
        accent: "bg-danger/10",
      },
      {
        title: isAm ? "የተደረጉ ሽፍቶች" : "Shift Records",
        value: totals.totalShifts,
        icon: <ChartBarStacked className="size-5 text-warning" />,
        accent: "bg-warning/10",
      },
      {
        title: isAm ? "መጠንቀቅ መጠን" : "Approval Rate",
        value: `${totals.approvalRate}%`,
        icon: <TrendingUp className="size-5 text-success" />,
        accent: "bg-success/10",
      },
    ];
  }, [totals, isAm]);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => currentYear - 3 + idx).map(
      (value) => ({
        value: value.toString(),
        label: value.toString(),
      })
    );
  }, [currentYear]);

  const maxMonthlyValue = useMemo(() => {
    if (!monthly.length) return 1;
    return Math.max(...monthly.map((item) => item.total || 0), 1);
  }, [monthly]);

  return (
    <div className="h-full overflow-hidden p-3 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-default-900">
            {isAm ? "የሪፖርተር አብነት" : "Reporter Analytics"}
          </h1>
          <p className="text-sm text-default-500">
            {isAm
              ? "የዕለታዊ ሪፖርቶችን እና ሽፍት ስታቲስቲክስን ይቆጥቡ"
              : "Monitor daily report trends, missing days, and shift activity."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            aria-label="year selector"
            selectedKeys={new Set([selectedYear.toString()])}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              if (value) {
                setSelectedYear(parseInt(value, 10));
              }
            }}
            size="sm"
            variant="bordered"
            className="sm:w-[160px]"
          >
            {yearOptions.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoadingAnalytics && !totals
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="border border-default-200/60 shadow-sm"
              >
                <CardBody className="p-4">
                  <Skeleton className="h-20 w-full rounded-xl" />
                </CardBody>
              </Card>
            ))
          : cards.map((card, index) => (
              <Card
                key={index}
                className="border border-default-200/60 shadow-sm hover:shadow-md transition"
              >
                <CardBody className="p-4 flex flex-col gap-3">
                  <div
                    className={`size-10 rounded-xl ${card.accent} grid place-items-center`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm text-default-500">{card.title}</p>
                    <p className="text-2xl font-semibold text-default-900">
                      {card.value ?? 0}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-default-200/60 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-default-900">
              {isAm ? "የወር ሪፖርት ክፍተት" : "Monthly Report Volume"}
            </h2>
            <p className="text-xs text-default-500">
              {isAm
                ? "የተመዘገቡ ዕለታዊ ሪፖርቶችን እና የተጠፉ ቀናትን ይመልከቱ"
                : "Monthly distribution of submitted reports and missing days."}
            </p>
          </CardHeader>
          <CardBody className="p-4">
            {isLoadingAnalytics ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : monthly.length ? (
              <div className="flex items-end gap-3 h-48">
                {monthly.map((item) => {
                  const totalHeight = Math.max(
                    6,
                    Math.round((item.total / maxMonthlyValue) * 100)
                  );
                  const absentHeight = Math.round(
                    ((item.absent || 0) / maxMonthlyValue) * 100
                  );
                  return (
                    <div
                      key={item.month}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div className="relative h-full w-full max-w-[32px] rounded-lg bg-default-200/70 overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary-500/80"
                          style={{ height: `${totalHeight}%` }}
                        />
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-danger-500/90"
                          style={{ height: `${absentHeight}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-default-500">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-default-500">
                {isAm ? "መረጃ የለም" : "No data available."}
              </div>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs text-default-500">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary-500" />
                <span>{isAm ? "ጠቅላላ ሪፖርቶች" : "Total reports"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-danger-500" />
                <span>{isAm ? "የተጠፉ ቀናት" : "Missing days"}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-default-900">
                {isAm ? "ምርጥ መምህሮች" : "Top Teachers"}
              </h2>
              <p className="text-xs text-default-500">
                {isAm ? "በተጠፉ ቀናት መሠረት" : "Ranked by highest missing days"}
              </p>
            </div>
            <Chip size="sm" color="primary" variant="flat">
              {topTeachers.length || 0}
            </Chip>
          </CardHeader>
          <CardBody className="p-0">
            {isLoadingAnalytics ? (
              <Skeleton className="h-48 w-full rounded-none" />
            ) : topTeachers.length ? (
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-default-100 dark:bg-default-900/80 text-default-500">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        {isAm ? "መምህር" : "Teacher"}
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        {isAm ? "ጠቅላላ" : "Total"}
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        {isAm ? "የጠፉ" : "Absent"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTeachers.map((teacher) => (
                      <tr
                        key={teacher.teacherId}
                        className="border-t border-default-200/70"
                      >
                        <td className="px-4 py-2 text-default-700 dark:text-default-200">
                          {teacher.teacherName}
                        </td>
                        <td className="px-4 py-2 text-center text-default-600">
                          {teacher.total}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Chip color="danger" size="sm" variant="flat">
                            {teacher.absent}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-default-500">
                {isAm ? "የመምህር መረጃ የለም" : "No teacher analytics available."}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <CustomAlert
        isOpen={isAlertOpen}
        onClose={closeAlert}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
      />
    </div>
  );
}
