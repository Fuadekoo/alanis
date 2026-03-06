import { ArrowDownAZ, ArrowLeft, ArrowRight, ArrowUpAZ } from "lucide-react";
import { Button } from "./ui/heroui";

export default function PaginationPlace({
  sort,
  onSortChange,
  totalPage,
  currentPage,
  onPageChange,
  row,
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

  const createRange = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const getItems = (
    total: number,
    page: number,
    siblings = 1,
    boundaries = 1,
  ): (number | "dots")[] => {
    if (total <= 1) return [1];

    const startPages = createRange(1, Math.min(boundaries, total));
    const endPages = createRange(
      Math.max(total - boundaries + 1, boundaries + 1),
      total,
    );

    const leftSibling = Math.max(
      page - siblings,
      boundaries + 2, // leave space for 1 and dots
    );
    const rightSibling = Math.min(
      page + siblings,
      total - boundaries - 1, // leave space for last and dots
    );

    const shouldShowLeftDots = leftSibling > boundaries + 2;
    const shouldShowRightDots = rightSibling < total - boundaries - 1;

    const middlePages =
      leftSibling > rightSibling ? [] : createRange(leftSibling, rightSibling);

    const items: (number | "dots")[] = [...startPages];
    if (shouldShowLeftDots) items.push("dots");
    else if (boundaries + 1 < leftSibling)
      items.push(...createRange(boundaries + 1, leftSibling - 1));

    items.push(...middlePages);

    if (shouldShowRightDots) items.push("dots");
    else if (rightSibling + 1 <= total - boundaries)
      items.push(...createRange(rightSibling + 1, total - boundaries));

    items.push(...endPages);
    return items;
  };

  const desktopItems = getItems(totalPage, currentPage, 1, 1);
  const mobileItems = getItems(totalPage, currentPage, 0, 1);

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
          Showing {start} to {end} of{" "}
          <span className="bg-primary text-white font-medium px-1.5 py-0.5 rounded ml-1 mr-1">
            {totalData}
          </span>{" "}
          {itemName}
        </div>
      </div>

      <div className="flex items-center gap-4 max-md:w-full overflow-x-auto">
        {totalPage > 0 && (
          <>
            <nav
              aria-label="Pagination"
              className="hidden sm:flex items-center gap-1"
            >
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label="Previous page"
                className="text-default-600"
                isDisabled={currentPage <= 1}
                onPress={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                <ArrowLeft className="size-4" />
              </Button>
              {desktopItems.map((item, idx) =>
                item === "dots" ? (
                  <span key={`dots-${idx}`} className="px-2 text-default-400">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    size="sm"
                    variant={item === currentPage ? "flat" : "light"}
                    className={
                      item === currentPage
                        ? "bg-default-100 dark:bg-default-900/40"
                        : "text-default-700"
                    }
                    onPress={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label="Next page"
                className="text-default-600"
                isDisabled={currentPage >= totalPage}
                onPress={() =>
                  onPageChange(Math.min(totalPage, currentPage + 1))
                }
              >
                <ArrowRight className="size-4" />
              </Button>
            </nav>

            <nav
              aria-label="Pagination"
              className="flex sm:hidden items-center gap-1"
            >
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label="Previous page"
                className="text-default-600"
                isDisabled={currentPage <= 1}
                onPress={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                <ArrowLeft className="size-4" />
              </Button>
              {mobileItems.map((item, idx) =>
                item === "dots" ? (
                  <span key={`mdots-${idx}`} className="px-2 text-default-400">
                    …
                  </span>
                ) : (
                  <Button
                    key={`m-${item}`}
                    size="sm"
                    variant={item === currentPage ? "flat" : "light"}
                    className={
                      item === currentPage
                        ? "bg-default-100 dark:bg-default-900/40"
                        : "text-default-700"
                    }
                    onPress={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label="Next page"
                className="text-default-600"
                isDisabled={currentPage >= totalPage}
                onPress={() =>
                  onPageChange(Math.min(totalPage, currentPage + 1))
                }
              >
                <ArrowRight className="size-4" />
              </Button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
