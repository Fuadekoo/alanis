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
  totalData = 0,
  itemName = "items",
}: {
  sort: boolean;
  onSortChange: () => void;
  totalPage: number;
  currentPage: number;
  onPageChange: (value: number) => void;
  row: number;
  onRowChange: (value: number) => void;
  totalData?: number;
  itemName?: string;
}) {
  const start = totalData === 0 ? 0 : (currentPage - 1) * row + 1;
  const end = Math.min(currentPage * row, totalData);

  return (
    <div className="py-3 px-1 border-t border-default-200/50 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-default-500 overflow-x-auto w-full">
      <div className="flex items-center gap-2 max-md:self-start">
        <Button
          isIconOnly
          size="sm"
          className="bg-default-50/50 mr-2"
          onPress={onSortChange}
        >
          {sort ? (
            <ArrowDownAZ className="size-4" />
          ) : (
            <ArrowUpAZ className="size-4" />
          )}
        </Button>
        <div className="whitespace-nowrap">
          Showing {start} to {end} of <span className="bg-primary text-white font-medium px-1.5 py-0.5 rounded ml-1 mr-1">{totalData}</span> {itemName}
        </div>
      </div>

      <div className="flex items-center gap-4 max-md:w-full overflow-x-auto">
        <div className="flex items-center whitespace-nowrap gap-2">
          Rows per page:
          <Select
            size="sm"
            variant="flat"
            classNames={{ base: "w-20", trigger: "bg-default-50/50 shadow-sm border border-default-200" }}
            disallowEmptySelection
            selectedKeys={new Set([row + ""])}
            onSelectionChange={(v) => onRowChange(+Array.from(v)[0])}
          >
            {["10", "20", "50", "100", "200"].map((v) => (
              <SelectItem variant="flat" key={v}>
                {v}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Pagination
          size="md"
          variant="flat"
          showControls
          total={totalPage}
          page={currentPage}
          onChange={onPageChange}
        />
      </div>
    </div>
  );
}
