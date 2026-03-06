"use client";

import React from "react";
import { useController } from "./provider";
import SearchPlace from "@/components/searchPlace";
import useAmharic from "@/hooks/useAmharic";
import {
  Button,
  ScrollShadow,
  Skeleton,
  Select,
  SelectItem,
} from "@/components/ui/heroui";
import { Plus } from "lucide-react";
import { cn } from "@heroui/react";
import { highlight } from "@/lib/utils";
import PaginationPlace from "@/components/paginationPlace";

export default function List() {
  const {
    controller: { filter, data, isLoading, selected, onSelected, registration },
    onDetail,
  } = useController();
  const isAm = useAmharic();

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
          </div>
        }
        endContent={
          <Button
            size="sm"
            color="primary"
            className="shrink-0"
            startContent={<Plus className="size-4" />}
            onPress={registration.add.bind(undefined)}
          >
            {isAm ? "አዲስ ተቆጣጣሪ" : "New Controller"}
          </Button>
        }
      />
      {!data || isLoading ? (
        <Skeleton />
      ) : (
        <ScrollShadow className="p-2 pb-40 bg-default-50/40 border border-default-50/40 rounded-xl grid gap-y-2 gap-x-5 auto-rows-min xl:grid-cols-2 overflow-auto ">
          {data.list.map(({ id, firstName, fatherName, lastName }, i) => (
            <Button
              key={i + ""}
              variant="flat"
              className={cn(
                "h-fit p-2 bg-default-50/50 border-2 flex-col gap-1 items-start text-base md:text-xl ",
                id == selected
                  ? "border-primary-400 text-primary-600"
                  : "border-default-400",
              )}
              onPress={() => {
                onSelected(id);
                onDetail(true);
              }}
            >
              <p className="capitalize">
                {i + 1}{" "}
                {highlight(
                  `${firstName} ${fatherName} ${lastName}`,
                  filter.search,
                )}
              </p>
            </Button>
          ))}
        </ScrollShadow>
      )}
      <PaginationPlace
        {...filter}
        totalPage={Math.ceil((data?.totalData ?? 0) / filter.row) || 1}
      />
    </div>
  );
}
