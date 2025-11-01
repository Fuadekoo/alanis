"use client";

import { useState } from "react";
import { useTeacher } from "./provider";
import useData from "@/hooks/useData";
import { getReportByTeacher } from "@/actions/controller/report";
import { Skeleton, Card, CardBody, Tabs, Tab } from "@/components/ui/heroui";
import { BookOpen, FileText, TrendingUp, Users, History } from "lucide-react";
import { Chip } from "@heroui/react";
import CustomTable from "@/components/customTable";
import useAmharic from "@/hooks/useAmharic";

export function Report() {
  const [activeTab, setActiveTab] = useState<string>("current");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isAm = useAmharic();

  const {
    teacher: { selected },
  } = useTeacher();

  // Get teacher report data
  const [data, isLoading] = useData(getReportByTeacher, () => {}, selected);

  // Prepare table data - Display TeacherProgress records
  const currentReports =
    data?.data?.currentProgress?.map((progress) => ({
      key: progress.id,
      id: progress.id,
      studentName: `${progress.student.firstName} ${progress.student.lastName}`,
      studentPhone: progress.student.phoneNumber,
      studentUsername: progress.student.username,
      learningSlot: progress.learningSlot || "N/A",
      learningCount: progress.learningCount,
      missingCount: progress.missingCount,
      totalCount:
        progress.totalCount || progress.learningCount + progress.missingCount,
      progressStatus: progress.progressStatus,
      paymentStatus: progress.paymentStatus,
      createdAt: new Date(progress.createdAt).toLocaleDateString(),
      dailyReportsCount: progress.dailyReports?.length || 0,
    })) || [];

  const historicalReports =
    data?.data?.historicalProgress?.map((progress) => ({
      key: progress.id,
      id: progress.id,
      studentName: `${progress.student.firstName} ${progress.student.lastName}`,
      studentPhone: progress.student.phoneNumber,
      studentUsername: progress.student.username,
      learningSlot: progress.learningSlot || "N/A",
      learningCount: progress.learningCount,
      missingCount: progress.missingCount,
      totalCount:
        progress.totalCount || progress.learningCount + progress.missingCount,
      progressStatus: progress.progressStatus,
      paymentStatus: progress.paymentStatus,
      createdAt: new Date(progress.createdAt).toLocaleDateString(),
      dailyReportsCount: progress.dailyReports?.length || 0,
    })) || [];

  const columns = [
    {
      key: "studentName",
      label: isAm ? "ተማሪ ስም" : "Student Name",
      renderCell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.studentName}</span>
          <span className="text-xs text-default-400">
            @{item.studentUsername}
          </span>
        </div>
      ),
    },
    {
      key: "studentPhone",
      label: isAm ? "ስልክ" : "Phone",
    },
    {
      key: "learningSlot",
      label: isAm ? "የትምህርት ሰዓት" : "Learning Slot",
    },
    {
      key: "learningCount",
      label: isAm ? "የመማሪያ ቀናት" : "Learning Days",
      renderCell: (item: any) => (
        <Chip color="success" size="sm" variant="flat">
          {item.learningCount}
        </Chip>
      ),
    },
    {
      key: "missingCount",
      label: isAm ? "የጠፋ ቀናት" : "Missing Days",
      renderCell: (item: any) => (
        <Chip color="danger" size="sm" variant="flat">
          {item.missingCount}
        </Chip>
      ),
    },
    {
      key: "totalCount",
      label: isAm ? "ጠቅላላ" : "Total",
      renderCell: (item: any) => (
        <Chip color="primary" size="sm" variant="flat">
          {item.totalCount}
        </Chip>
      ),
    },
    {
      key: "dailyReportsCount",
      label: isAm ? "ሪፖርቶች" : "Reports",
      renderCell: (item: any) => (
        <Chip color="secondary" size="sm" variant="flat">
          {item.dailyReportsCount}
        </Chip>
      ),
    },
    {
      key: "progressStatus",
      label: isAm ? "የሂደት ሁኔታ" : "Progress Status",
      renderCell: (item: any) => (
        <Chip
          color={item.progressStatus === "open" ? "success" : "default"}
          size="sm"
          variant="dot"
        >
          {item.progressStatus === "open"
            ? isAm
              ? "ክፍት"
              : "Open"
            : isAm
            ? "ዝግ"
            : "Closed"}
        </Chip>
      ),
    },
    {
      key: "paymentStatus",
      label: isAm ? "የክፍያ ሁኔታ" : "Payment Status",
      renderCell: (item: any) => (
        <Chip
          color={
            item.paymentStatus === "approved"
              ? "success"
              : item.paymentStatus === "pending"
              ? "warning"
              : "danger"
          }
          size="sm"
          variant="flat"
        >
          {item.paymentStatus === "approved"
            ? isAm
              ? "ጸድቋል"
              : "Approved"
            : item.paymentStatus === "pending"
            ? isAm
              ? "በመጠባበቅ ላይ"
              : "Pending"
            : isAm
            ? "ተቀባይነት አላገኘም"
            : "Rejected"}
        </Chip>
      ),
    },
    {
      key: "createdAt",
      label: isAm ? "የተፈጠረበት ቀን" : "Created Date",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="shrink-0 bg-default-50/50 rounded-xl grid grid-rows-[auto_1fr] overflow-hidden gap-3 p-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20">
          <CardBody className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-600">
                  {isAm ? "ንቁ ተማሪዎች" : "Current Students"}
                </p>
                <p className="text-2xl font-bold text-success-700 dark:text-success-400">
                  {data?.data?.currentProgress?.length || 0}
                </p>
              </div>
              <Users className="size-8 text-success-600 dark:text-success-400 opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20">
          <CardBody className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-600">
                  {isAm ? "ታሪካዊ ተማሪዎች" : "Historical Students"}
                </p>
                <p className="text-2xl font-bold text-warning-700 dark:text-warning-400">
                  {data?.data?.historicalProgress?.length || 0}
                </p>
              </div>
              <History className="size-8 text-warning-600 dark:text-warning-400 opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
          <CardBody className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-600">
                  {isAm ? "ጠቅላላ ሪፖርቶች" : "Total Reports"}
                </p>
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                  {currentReports.length + historicalReports.length}
                </p>
              </div>
              <FileText className="size-8 text-primary-600 dark:text-primary-400 opacity-50" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20">
          <CardBody className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-600">
                  {isAm ? "የመማሪያ ቀናት" : "Learning Days"}
                </p>
                <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-400">
                  {data?.data?.currentProgress?.reduce(
                    (sum, p) => sum + p.learningCount,
                    0
                  ) || 0}
                </p>
              </div>
              <TrendingUp className="size-8 text-secondary-600 dark:text-secondary-400 opacity-50" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs and Reports Table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardBody className="flex-1 p-0 overflow-auto">
          <Tabs
            aria-label="Report tabs"
            selectedKey={activeTab}
            onSelectionChange={(key: React.Key) => {
              setActiveTab(key as string);
              setPage(1);
            }}
            color="primary"
            variant="underlined"
            classNames={{
              tabList:
                "gap-6 w-full relative rounded-none p-4 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-4 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
          >
            <Tab
              key="current"
              title={
                <div className="flex items-center space-x-2">
                  <BookOpen className="size-4" />
                  <span>{isAm ? "ንቁ ሂደት" : "Current Progress"}</span>
                  <Chip size="sm" variant="flat" color="success">
                    {currentReports.length}
                  </Chip>
                </div>
              }
            >
              <div className="p-4">
                {currentReports.length > 0 ? (
                  <CustomTable
                    columns={columns}
                    rows={currentReports}
                    totalRows={currentReports.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newPageSize) => {
                      setPageSize(newPageSize);
                      setPage(1);
                    }}
                    searchValue={search}
                    onSearch={setSearch}
                    isLoading={isLoading}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="size-16 text-default-300 mb-4" />
                    <h3 className="text-lg font-semibold text-default-600 mb-2">
                      {isAm ? "ንቁ የመማሪያ ሂደት የለም" : "No Current Progress"}
                    </h3>
                    <p className="text-sm text-default-400 max-w-md">
                      {isAm
                        ? "ለዚህ መምህር ንቁ የሆኑ የተማሪ መማሪያ ሂደቶች የሉም። ተማሪዎች ለዚህ መምህር ሲመደቡ እዚህ ይታያሉ።"
                        : "There are no active student learning progress records for this teacher. When students are assigned to this teacher, they will appear here."}
                    </p>
                  </div>
                )}
              </div>
            </Tab>
            <Tab
              key="historical"
              title={
                <div className="flex items-center space-x-2">
                  <History className="size-4" />
                  <span>{isAm ? "ታሪካዊ መረጃ" : "Historical Data"}</span>
                  <Chip size="sm" variant="flat" color="warning">
                    {historicalReports.length}
                  </Chip>
                </div>
              }
            >
              <div className="p-4">
                {historicalReports.length > 0 ? (
                  <CustomTable
                    columns={columns}
                    rows={historicalReports}
                    totalRows={historicalReports.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newPageSize) => {
                      setPageSize(newPageSize);
                      setPage(1);
                    }}
                    searchValue={search}
                    onSearch={setSearch}
                    isLoading={isLoading}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="size-16 text-default-300 mb-4" />
                    <h3 className="text-lg font-semibold text-default-600 mb-2">
                      {isAm ? "ታሪካዊ መረጃ የለም" : "No Historical Data"}
                    </h3>
                    <p className="text-sm text-default-400 max-w-md">
                      {isAm
                        ? "ለዚህ መምህር ታሪካዊ የተማሪ ሂደት መረጃ የለም። ታሪካዊ መረጃ ተማሪዎች ወደ ሌላ መምህር ሲዘዋወሩ ይፈጠራል።"
                        : "There are no historical student progress records for this teacher. Historical data is created when students are shifted to another teacher."}
                    </p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
