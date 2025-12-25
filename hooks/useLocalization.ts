"use client";

import { useParams } from "next/navigation";
import { en } from "@/lib/locales/en";
import { am } from "@/lib/locales/am";
import { or } from "@/lib/locales/or";

export type Locale = "en" | "am" | "or";

export const useLocalization = () => {
  const params = useParams();
  const locale = (params?.lang as Locale) || "en";

  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".");
    let value: any = locale === "am" ? am : locale === "or" ? or : en;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    return value || fallback || key;
  };

  const getMonthName = (monthNumber: number): string => {
    const monthKeys = [
      "months.january",
      "months.february",
      "months.march",
      "months.april",
      "months.may",
      "months.june",
      "months.july",
      "months.august",
      "months.september",
      "months.october",
      "months.november",
      "months.december",
    ];

    return t(monthKeys[monthNumber - 1] || "months.january");
  };

  const formatCurrency = (amount: number, currency: string = "ETB"): string => {
    if (locale === "am" || locale === "or") {
      return `${amount.toLocaleString()} ${currency}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (locale === "am") {
      return dateObj.toLocaleDateString("am-ET");
    } else if (locale === "or") {
      return dateObj.toLocaleDateString("om-ET");
    }
    return dateObj.toLocaleDateString("en-US");
  };

  return {
    locale,
    t,
    getMonthName,
    formatCurrency,
    formatDate,
  };
};
