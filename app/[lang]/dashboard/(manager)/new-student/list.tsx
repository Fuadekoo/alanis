"use client";

import React from "react";
import {
  Button,
  ScrollShadow,
  Skeleton,
  Select,
  SelectItem,
} from "@/components/ui/heroui";
import SearchPlace from "@/components/searchPlace";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import { useStudent } from "./provider";
import { cn } from "@heroui/react";
import { highlight } from "@/lib/utils";
import { Trash } from "lucide-react";

export default function List() {
  const {
    student: { filter, data, isLoading, onApproved, deletion },
  } = useStudent();
  const isAm = useAmharic();

  const statusOptions = [
    { value: "all", label: isAm ? "ሁሉም" : "All" },
    { value: "new", label: isAm ? "አዲስ" : "New" },
    { value: "active", label: isAm ? "ተንቀሳቃሽ" : "Active" },
    { value: "inactive", label: isAm ? "ያልነቃ" : "Inactive" },
    { value: "onProgress", label: isAm ? "በሂደት ላይ" : "On Progress" },
    { value: "remedanLeft", label: isAm ? "ረመዳን ያለፈ" : "Remedan Left" },
  ];

  return (
    <div className="grid gap-5 grid-rows-[auto_1fr_auto] overflow-hidden ">
      <SearchPlace
        handleSearch={filter.handleSearch}
        startContent={
          <div className="flex gap-2 items-center flex-wrap">
            <Select
              aria-label="Rows per page"
              size="sm"
              className="w-20 md:w-24"
              selectedKeys={new Set([filter.row + ""])}
              onSelectionChange={(keys) => {
                const val = parseInt(Array.from(keys)[0] as string);
                if (!Number.isNaN(val)) filter.onRowChange(val);
              }}
            >
              {["10", "20", "50", "100", "200", "250"].map((opt) => (
                <SelectItem key={opt}>{opt}</SelectItem>
              ))}
            </Select>
            <Select
              aria-label="Status Filter"
              placeholder={isAm ? "ሁኔታ" : "Status"}
              size="sm"
              className="w-28 md:w-40"
              selectedKeys={[filter.status || "new"]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                filter.onStatusChange(val);
              }}
            >
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        }
      />
      {!data || isLoading ? (
        <Skeleton />
      ) : (
        <ScrollShadow className="p-2 pb-40 border border-default-100/80 rounded-xl grid gap-y-2 gap-x-5 auto-rows-min xl:grid-cols-2- ">
          {data.list.map(
            (
              { id, firstName, fatherName, lastName, country, phoneNumber },
              i
            ) => (
              <div
                key={i + ""}
                className={cn(
                  "h-fit p-2 bg-default-50/50 rounded-xl grid md:grid-cols-[1fr_auto_auto_auto] gap-2 items-center  "
                )}
              >
                <p className="text-start ">
                  {highlight(
                    `${firstName} ${fatherName} ${lastName}`,
                    filter.search
                  )}
                </p>
                <p className="w-48 text-start ">{country}</p>
                <p className="w-32 text-start ">{phoneNumber}</p>
                <div className="flex gap-2">
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => {
                      onApproved(id);
                    }}
                  >
                    {isAm ? "ያፅድቁ" : "approved"}
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    startContent={<Trash className="size-4 " />}
                    onPress={() => {
                      deletion.open(id);
                    }}
                  >
                    {isAm ? "ይሰርዙ" : "delete"}
                  </Button>
                </div>
              </div>
            )
          )}
        </ScrollShadow>
      )}
      <PaginationPlace
        {...filter}
        totalPage={Math.ceil((data?.totalData ?? 0) / filter.row) || 1}
      />
    </div>
  );
}
