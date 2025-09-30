"use client";
import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Calendar,
} from "@heroui/react";
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

export interface ColumnDef<T> {
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
  columns: Array<ColumnDef<Record<string, any>>>;
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

  const handleImageClick = (imageUrl: string) => {
    setZoomedImageUrl(imageUrl);
  };

  const handleCloseZoom = () => {
    setZoomedImageUrl(null);
  };

  // Add a handler for showing image from actions
  // const handleShowImage = (item: any) => {
  //   if (item.photo) {
  //     setZoomedImageUrl(`/api/filedata/${item.photo}`);
  //   }
  // };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Search and Controls */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Search Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <form
              className="flex items-center gap-2 w-full sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(localSearch);
              }}
            >
              <div className="relative flex w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search records..."
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    if (e.target.value === "") {
                      onSearch("");
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                  disabled={isLoading}
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch("");
                      onSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {enableDateFilter && (
                <button
                  type="button"
                  onClick={() => setShowDateFilter(true)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              )}
            </form>
          </div>

          {/* Page Size Control */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
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
        <Table
          aria-label="Data table with dynamic content"
          className="min-w-full"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={rows}
            emptyContent={
              !isLoading && rows.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    No data to display
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Try adjusting your search or filters
                  </div>
                </div>
              ) : null
            }
          >
            {(item) => (
              <TableRow
                key={item.key || item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                {(columnKey) => {
                  const column = columns.find((col) => col.key === columnKey);

                  if (columnKey === "actions") {
                    return (
                      <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          {column && column.renderCell
                            ? column.renderCell(item)
                            : null}
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
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {column && column.renderCell ? (
                        column.renderCell(item)
                      ) : columnKey === "photo" &&
                        typeof item.photo === "string" &&
                        item.photo ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={`/api/filedata/${item.photo}`}
                            alt={`Photo for ${item.id || item.key}`}
                            fill
                            className="object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() =>
                              handleImageClick(`/api/filedata/${item.photo}`)
                            }
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".no-preview-text")
                              ) {
                                const errorText =
                                  document.createElement("span");
                                errorText.textContent = "No preview";
                                errorText.className =
                                  "text-xs text-gray-400 dark:text-gray-500 no-preview-text flex items-center justify-center h-full";
                                parent.appendChild(errorText);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <span className="truncate max-w-xs block">
                          {getKeyValue(item, columnKey)}
                        </span>
                      )}
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading data...</span>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Results Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {rows.length > 0
                ? Math.min((page - 1) * pageSize + 1, totalRows)
                : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {Math.min(page * pageSize, totalRows)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalRows}
            </span>{" "}
            results
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => onPageChange(1)}
                disabled={page === 1 || isLoading}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pg) => {
                    if (totalPages <= 7) return true;
                    if (page <= 4) return pg <= 5 || pg === totalPages;
                    if (page >= totalPages - 3)
                      return pg >= totalPages - 4 || pg === 1;
                    return (
                      Math.abs(pg - page) <= 2 || pg === 1 || pg === totalPages
                    );
                  })
                  .map((pg, i, arr) => (
                    <React.Fragment key={pg}>
                      {i > 0 && pg - arr[i - 1] > 1 && (
                        <span className="px-2 text-gray-400 dark:text-gray-500">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => onPageChange(pg)}
                        disabled={isLoading}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pg === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages || isLoading}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
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
