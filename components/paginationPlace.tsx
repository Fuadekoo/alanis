import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Button, Pagination, Select, SelectItem } from "./ui/heroui";

export default function PaginationPlace({
  sort,
  onSortChange,
  totalPage,
  currentPage,
  onPageChange,
  row,
  onRowChange,
}: {
  sort: boolean;
  onSortChange: () => void;
  totalPage: number;
  currentPage: number;
  onPageChange: (value: number) => void;
  row: number;
  onRowChange: (value: number) => void;
}) {
  return (
    <div className="p-1 bg-default-400/20 border border-default-400/80 rounded-xl flex gap-2 justify-between overflow-x-auto">
      <Button
        isIconOnly
        size="sm"
        className="bg-default-50/50"
        onPress={onSortChange}
      >
        {sort ? (
          <ArrowDownAZ className="size-4" />
        ) : (
          <ArrowUpAZ className="size-4" />
        )}
      </Button>

      <Pagination
        size="sm"
        isCompact
        showControls
        total={totalPage}
        page={currentPage}
        onChange={onPageChange}
      />

      <Select
        size="sm"
        variant="flat"
        classNames={{ base: "w-fit", trigger: "w-20 bg-default-50/50" }}
        disallowEmptySelection
        selectedKeys={new Set([row + ""])}
        onSelectionChange={(v) => onRowChange(+Array.from(v)[0])}
      >
        {["50", "100", "150", "200", "250"].map((v) => (
          <SelectItem variant="flat" key={v}>
            {v}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
