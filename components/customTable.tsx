"use client";
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Calendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Image from "next/image";

export interface CustomColumnDef<T> {
  key: string;
  label: string;
  renderCell?: (item: T) => React.ReactNode;
}

interface CustomTableProps {
  rows: Array<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any> & { key?: string | number; id?: string | number }
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Array<CustomColumnDef<Record<string, any>>>;
  totalRows: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchValue: string;
  onSearch: (value: string) => void;
  isLoading?: boolean;
  enableDateFilter?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  onDateChange?: (dates: {
    startDate: string | null;
    endDate: string | null;
  }) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

function CustomTable({
  rows,
  columns,
  totalRows,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearch,
  isLoading = false,
  enableDateFilter = false,
  startDate,
  endDate,
  onDateChange,
}: CustomTableProps) {
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");

  // For search input local state
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Convert custom columns to TanStack Table format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tanstackColumns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    // Add row number column as the first column
    const numberColumn: ColumnDef<Record<string, any>> = {
      id: "#",
      header: "#",
      cell: ({ row }) => {
        const rowIndex = row.index;
        const rowNumber = (page - 1) * pageSize + rowIndex + 1;
        return (
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            {rowNumber}
          </span>
        );
      },
      size: 60,
    };

    return [
      numberColumn,
      ...columns.map((col) => ({
        id: col.key,
        accessorKey: col.key,
        header: col.label,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ row }: any) => {
          const item = row.original;

          // Handle actions column with image preview
          if (col.key === "actions") {
            return (
              <div className="flex items-center gap-2">
                {col.renderCell ? col.renderCell(item) : null}
                {item.photo && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400 transition-colors"
                    onClick={() =>
                      setZoomedImageUrl(`/api/filedata/${item.photo}`)
                    }
                    aria-label="View proof image"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          }

          // Handle photo column with image display
          if (
            col.key === "photo" &&
            typeof item.photo === "string" &&
            item.photo
          ) {
            return (
              <div className="relative w-16 h-16">
                <Image
                  src={`/api/filedata/${item.photo}`}
                  alt={`Photo for ${item.id || item.key}`}
                  fill
                  className="object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() =>
                    setZoomedImageUrl(`/api/filedata/${item.photo}`)
                  }
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector(".no-preview-text")) {
                      const errorText = document.createElement("span");
                      errorText.textContent = "No preview";
                      errorText.className =
                        "text-xs text-gray-400 dark:text-gray-500 no-preview-text flex items-center justify-center h-full";
                      parent.appendChild(errorText);
                    }
                  }}
                />
              </div>
            );
          }

          // Use custom renderCell if provided
          if (col.renderCell) {
            return col.renderCell(item);
          }

          // Default rendering
          return (
            <span className="truncate max-w-xs block">
              {item[col.key] !== undefined && item[col.key] !== null
                ? String(item[col.key])
                : ""}
            </span>
          );
        },
      })),
    ];
  }, [columns, page, pageSize]);

  // Create TanStack Table instance
  const table = useReactTable({
    data: rows,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleApplyDateFilter = () => {
    if (onDateChange) {
      onDateChange({ startDate: localStartDate, endDate: localEndDate });
    }
    setShowDateFilter(false);
  };

  const handleClearDateFilter = () => {
    setLocalStartDate("");
    setLocalEndDate("");
    if (onDateChange) {
      onDateChange({ startDate: null, endDate: null });
    }
    setShowDateFilter(false);
  };

  const handleCloseZoom = () => {
    setZoomedImageUrl(null);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-default-200 dark:border-default-700 overflow-hidden">
      {/* Header with Search and Controls */}
      <div className="p-3 sm:p-4 border-b border-default-200 dark:border-default-700">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          {/* Search Section */}
          <div className="flex items-center gap-2 flex-1">
            <form
              className="flex items-center gap-2 flex-1 min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(localSearch);
              }}
            >
              <div className="relative flex flex-1 min-w-0 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-default-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    if (e.target.value === "") {
                      onSearch("");
                    }
                  }}
                  className="w-full pl-8 pr-8 py-2 text-sm border border-default-300 dark:border-default-600 rounded-lg bg-default-50 dark:bg-default-900 text-default-900 dark:text-default-100 placeholder-default-400 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  disabled={isLoading}
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch("");
                      onSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-default-400 hover:text-default-600 dark:hover:text-default-300 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {enableDateFilter && (
                <button
                  type="button"
                  onClick={() => setShowDateFilter(true)}
                  className="px-3 py-2 text-sm border border-default-300 dark:border-default-600 rounded-lg bg-default-50 dark:bg-default-900 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-800 transition-colors flex items-center gap-1.5 shrink-0"
                  disabled={isLoading}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              )}
            </form>
          </div>

          {/* Page Size Control */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm text-default-600 dark:text-default-400 whitespace-nowrap">
              Rows:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 sm:px-3 py-2 text-sm border border-default-300 dark:border-default-600 rounded-lg bg-default-50 dark:bg-default-900 text-default-900 dark:text-default-100 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              disabled={isLoading}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Filter Modal */}
      {showDateFilter && enableDateFilter && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-4xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Filter by Date Range
              </h2>
              <button
                onClick={() => setShowDateFilter(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Start Date
                </h3>
                <Calendar
                  aria-label="Start Date"
                  value={localStartDate ? parseDate(localStartDate) : null}
                  onChange={(date) =>
                    setLocalStartDate(date ? date.toString() : "")
                  }
                  isDisabled={isLoading}
                  className="w-full"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  End Date
                </h3>
                <Calendar
                  aria-label="End Date"
                  value={localEndDate ? parseDate(localEndDate) : null}
                  onChange={(date) =>
                    setLocalEndDate(date ? date.toString() : "")
                  }
                  isDisabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDateFilter(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDateFilter}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Clear
              </button>
              <button
                onClick={handleApplyDateFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-default-200 dark:divide-default-700">
          <thead className="bg-default-100 dark:bg-default-800/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-default-700 dark:text-default-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-default-200 dark:divide-default-700">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex justify-center items-center gap-3 text-default-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center"
                >
                  <div className="text-default-500 text-base font-medium">
                    No data to display
                  </div>
                  <div className="text-default-400 text-sm mt-1">
                    Try adjusting your search or filters
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-default-50 dark:hover:bg-default-800/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 sm:px-4 py-3 text-sm text-default-900 dark:text-default-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-3 sm:px-4 py-3 border-t border-default-200 dark:border-default-700 bg-default-50 dark:bg-default-800/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Results Info */}
          <div className="text-xs sm:text-sm text-default-600 dark:text-default-400 order-2 sm:order-1">
            <span className="hidden sm:inline">Showing </span>
            <span className="font-semibold text-default-900 dark:text-default-100">
              {rows.length > 0
                ? Math.min((page - 1) * pageSize + 1, totalRows)
                : 0}
            </span>
            {" - "}
            <span className="font-semibold text-default-900 dark:text-default-100">
              {Math.min(page * pageSize, totalRows)}
            </span>
            <span className="hidden sm:inline"> of </span>
            <span className="sm:hidden"> / </span>
            <span className="font-semibold text-default-900 dark:text-default-100">
              {totalRows}
            </span>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 order-1 sm:order-2">
              {/* First Page */}
              <button
                onClick={() => onPageChange(1)}
                disabled={page === 1 || isLoading}
                className="p-1.5 sm:p-2 rounded-lg border border-default-300 dark:border-default-600 bg-white dark:bg-default-900 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="p-1.5 sm:p-2 rounded-lg border border-default-300 dark:border-default-600 bg-white dark:bg-default-900 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pg) => {
                    if (totalPages <= 5) return true;
                    if (page <= 3) return pg <= 4 || pg === totalPages;
                    if (page >= totalPages - 2)
                      return pg >= totalPages - 3 || pg === 1;
                    return (
                      Math.abs(pg - page) <= 1 || pg === 1 || pg === totalPages
                    );
                  })
                  .map((pg, i, arr) => (
                    <React.Fragment key={pg}>
                      {i > 0 && pg - arr[i - 1] > 1 && (
                        <span className="px-1 text-default-400 text-xs">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => onPageChange(pg)}
                        disabled={isLoading}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          pg === page
                            ? "bg-primary text-white"
                            : "border border-default-300 dark:border-default-600 bg-white dark:bg-default-900 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-800"
                        } disabled:cursor-not-allowed`}
                      >
                        {pg}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              {/* Next Page */}
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || isLoading}
                className="p-1.5 sm:p-2 rounded-lg border border-default-300 dark:border-default-600 bg-white dark:bg-default-900 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages || isLoading}
                className="p-1.5 sm:p-2 rounded-lg border border-default-300 dark:border-default-600 bg-white dark:bg-default-900 text-default-700 dark:text-default-300 hover:bg-default-100 dark:hover:bg-default-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseZoom}
        >
          <div
            className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl max-w-[95vw] max-h-[95vh] flex items-center justify-center border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={zoomedImageUrl}
              alt="Zoomed content"
              className="block max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              width={1200}
              height={800}
            />
            <button
              onClick={handleCloseZoom}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 focus:outline-none transition-colors"
              aria-label="Close zoomed image"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomTable;
