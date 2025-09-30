"use client";
import React from "react";
import useData from "@/hooks/useData";
import { paymentDashboard } from "@/actions/manager/payment";
import { useLocalization } from "@/hooks/useLocalization";
import {
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  UserCheck,
  UserX,
  BarChart3,
  Calendar,
} from "lucide-react";

function Page() {
  const { t, formatCurrency } = useLocalization();

  const [dashboardData, isLoading] = useData(paymentDashboard, () => {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-auto px-2 py-6">
      <div className="w-full mx-auto grid grid-rows-[auto_1fr] gap-6 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t("dashboard.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("dashboard.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Total Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Payment ETB */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">
                  {t("dashboard.totalPaymentETB")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : formatCurrency(Number(dashboardData?.totalPayment || 0))}
                </p>
                <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">
                  {t("dashboard.allTimePayments")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Payment Person Count */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg border border-green-200 dark:border-green-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 dark:text-green-200 text-sm font-medium">
                  {t("dashboard.totalPaymentPersonCount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : dashboardData?.totalPaymentPersonCount || 0}
                </p>
                <p className="text-green-100 dark:text-green-200 text-xs mt-1">
                  {t("dashboard.uniqueStudentsPaid")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* This Month Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* This Month Payment ETB */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 dark:text-purple-200 text-sm font-medium">
                  {t("dashboard.thisMonthPaymentETB")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : formatCurrency(
                        Number(dashboardData?.thisMonthPayment || 0)
                      )}
                </p>
                <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">
                  {t("dashboard.currentMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Payment Person Count */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm font-medium">
                  {t("dashboard.thisMonthPaymentPersonCount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : dashboardData?.thisMonthPaymentPersonCount || 0}
                </p>
                <p className="text-indigo-100 dark:text-indigo-200 text-xs mt-1">
                  {t("dashboard.paidThisMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* This Month Unpaid Person Count */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 dark:text-red-200 text-sm font-medium">
                  {t("dashboard.thisMonthUnpaidPersonCount")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : dashboardData?.thisMonthUnpaidPersonCount || 0}
                </p>
                <p className="text-red-100 dark:text-red-200 text-xs mt-1">
                  {t("dashboard.unpaidThisMonth")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <UserX className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Payment Value */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-xl shadow-lg border border-amber-200 dark:border-amber-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 dark:text-amber-200 text-sm font-medium">
                  {t("dashboard.maxPaymentValue")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : formatCurrency(
                        Number(dashboardData?.maxValuePayment || 0)
                      )}
                </p>
                <p className="text-amber-100 dark:text-amber-200 text-xs mt-1">
                  {t("dashboard.highestPayment")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Min Payment Value */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl shadow-lg border border-teal-200 dark:border-teal-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 dark:text-teal-200 text-sm font-medium">
                  {t("dashboard.minPaymentValue")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading
                    ? "..."
                    : formatCurrency(
                        Number(dashboardData?.minValuePayment || 0)
                      )}
                </p>
                <p className="text-teal-100 dark:text-teal-200 text-xs mt-1">
                  {t("dashboard.lowestPayment")}
                </p>
              </div>
              <div className="p-3 bg-white/20 dark:bg-white/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
