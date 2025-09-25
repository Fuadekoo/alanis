"use client";
import { useState } from "react";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface MonthPickerProps {
  paidMonths?: { year: number; month: number }[];
  onChange?: (monthsToPay: string[]) => void;
}

export default function MonthPicker({
  paidMonths = [],
  onChange,
}: MonthPickerProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const toggleMonth = (monthIndex: number) => {
    const key = `${year},${monthIndex + 1}`; // e.g. "2025,1"
    let updated: string[];

    if (selectedMonths.includes(key)) {
      updated = selectedMonths.filter((m) => m !== key);
    } else {
      updated = [...selectedMonths, key];
    }

    setSelectedMonths(updated);
    if (onChange) onChange(updated);
  };

  const getMonthClass = (monthIndex: number) => {
    const key = `${year},${monthIndex + 1}`;
    const isSelected = selectedMonths.includes(key);
    const isPaid = paidMonths.some(
      (m) => m.year === year && m.month === monthIndex
    );

    const currentDate = new Date(today.getFullYear(), today.getMonth());
    const targetDate = new Date(year, monthIndex);

    if (isSelected) return "bg-blue-600 text-white"; // selected
    if (isPaid) return "bg-green-500 text-white"; // ✅ paid
    if (targetDate < currentDate) return "bg-red-500 text-white"; // ❌ past not paid
    if (targetDate > currentDate) return "bg-yellow-400 text-black"; // ⏳ future
    return "bg-gray-300 text-black"; // current month
  };

  return (
    <div className="p-4 rounded-xl shadow-lg border bg-white dark:bg-gray-800 w-80">
      {/* YEAR SELECTOR */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setYear(year - 1)}
          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
        >
          ◀
        </button>
        <span className="font-bold text-lg">{year}</span>
        <button
          onClick={() => setYear(year + 1)}
          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
        >
          ▶
        </button>
      </div>

      {/* MONTH GRID */}
      <div className="grid grid-cols-4 gap-3">
        {months.map((m, idx) => (
          <button
            key={idx}
            onClick={() => toggleMonth(idx)}
            className={`p-2 rounded-lg font-semibold transition hover:scale-105 ${getMonthClass(
              idx
            )}`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
