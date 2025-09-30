"use client";
import React, { useState } from "react";
import CustomTable from "@/components/customTable";
import useData from "@/hooks/useData";
import { getStudent, getPayment } from "@/actions/controller/payment";
import { useLocalization } from "@/hooks/useLocalization";
import { TrendingUp, CreditCard, Users, DollarSign } from "lucide-react";

function Page() {
  const { t, formatCurrency } = useLocalization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Get students for dropdown
  const [studentsData, isLoadingStudents] = useData(
    getStudent,
    () => {},
    page,
    pageSize
  );

  // Get payments for selected student
  const [data, isLoading, refresh] = useData(
    getPayment,
    () => {},
    selectedStudentId,
    page,
    pageSize,
    search
  );

  const rows = (data?.data || []).map((payment) => ({
    key: String(payment.id),
    id: String(payment.id),
    studentName: payment.user
      ? `${payment.user.firstName} ${payment.user.fatherName} ${payment.user.lastName}`
      : "N/A",
    studentPhone: payment.user?.phoneNumber || "N/A",
    teacherName: payment.user?.roomStudent?.[0]?.teacher
      ? `${payment.user.roomStudent[0].teacher.firstName} ${payment.user.roomStudent[0].teacher.fatherName} ${payment.user.roomStudent[0].teacher.lastName}`
      : "N/A",
    amount:
      payment.perMonthAmount != null ? String(payment.perMonthAmount) : "",
    year: payment.year,
    month: payment.month,
    createdAt: payment.createdAt ?? "",
  }));

  const columns = [
    {
      key: "studentName",
      label: t("payment.studentName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.studentName,
    },
    {
      key: "studentPhone",
      label: t("payment.studentPhone"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.studentPhone,
    },
    {
      key: "teacherName",
      label: t("payment.teacherName"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.teacherName,
    },
    {
      key: "amount",
      label: t("payment.amount"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => (
        <span>{formatCurrency(Number(item.amount))}</span>
      ),
    },
    {
      key: "year",
      label: t("payment.year"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.year,
    },
    {
      key: "month",
      label: t("payment.month"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) => item.month,
    },
    {
      key: "createdAt",
      label: t("payment.createdAt"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderCell: (item: any) =>
        item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto px-2 py-6">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t("payment.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("payment.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Student Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t("payment.selectStudent")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("payment.selectStudentDescription")}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("payment.selectStudent")}</option>
                {studentsData?.data?.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.fatherName} {student.lastName}{" "}
                    - {student.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payment Table */}
        {selectedStudentId && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t("payment.paymentHistory")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t("payment.viewAllPayments")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-900">
              <CustomTable
                columns={columns}
                rows={rows}
                totalRows={data?.pagination?.totalRecords || 0}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newPageSize) => {
                  setPageSize(newPageSize);
                  setPage(1);
                }}
                searchValue={search}
                onSearch={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* No Student Selected Message */}
        {!selectedStudentId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t("payment.noStudentSelected")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                {t("payment.noStudentSelectedDescription")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
