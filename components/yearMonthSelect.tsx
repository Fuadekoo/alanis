"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/heroui";
import { addQuery } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const today = new Date();

const years = Array(today.getFullYear() - 2025 + 1)
  .fill({})
  .map((v, i) => 2025 + i);

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [year, setYear] = useState(years[0]);
  const [month, setMonth] = useState(
    today.getFullYear() == year ? today.getMonth() : 0
  );

  useEffect(() => {
    router.push(
      `?${addQuery(searchParams, [
        { name: "year", value: year },
        { name: "month", value: month },
      ])}`
    );
  }, [searchParams, year, month]);

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
            <DropdownItem key={i} onPress={() => setYear(v)}>
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
              <DropdownItem key={i} onPress={() => setMonth(i)}>
                {v}
              </DropdownItem>
            ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
