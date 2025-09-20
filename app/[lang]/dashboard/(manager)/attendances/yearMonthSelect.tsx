"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/heroui";
import { ChevronsUpDown } from "lucide-react";
import React, { useMemo } from "react";
import { useLayout } from "./provider";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "Jun",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function YearMonthSelect() {
  const today = useMemo(() => new Date(), []);
  const years = useMemo(() => {
    return Array(today.getFullYear() - 2025 + 1)
      .fill({})
      .map((v, i) => 2025 + i);
  }, [today]);

  const { year, onYear, month, onMonth } = useLayout();
  return (
    <div className="grid gap-2 grid-cols-2">
      <Dropdown>
        <DropdownTrigger>
          <Button
            className="justify-between bg-default-50/50"
            endContent={<ChevronsUpDown className="size-4 shrink-0" />}
          >
            {year}
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          {years.map((v, i) => (
            <DropdownItem key={i} onPress={() => onYear(v)}>
              {v}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <Dropdown>
        <DropdownTrigger>
          <Button
            className="justify-between bg-default-50/50"
            endContent={<ChevronsUpDown className="size-4 shrink-0" />}
          >
            {months[month]}
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          {months
            .slice(0, today.getFullYear() == year ? today.getMonth() + 1 : 11)
            .map((v, i) => (
              <DropdownItem key={i} onPress={() => onMonth(i)}>
                {v}
              </DropdownItem>
            ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
