import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useFilter() {
  const [filter, setFilter] = useState({
    search: "",
    sort: true,
    currentPage: 1,
    row: 250,
    status: "",
  });

  const handleSearch = useDebouncedCallback(
    (search: string) => setFilter((prev) => ({ ...prev, search, currentPage: 1 })),
    400
  );

  const onPageChange = (currentPage: number) =>
    setFilter((prev) => ({ ...prev, currentPage }));
  const onRowChange = (row: number) => setFilter((prev) => ({ ...prev, row, currentPage: 1 }));
  const onSortChange = () =>
    setFilter((prev) => ({ ...prev, sort: !prev.sort }));
  const onStatusChange = (status: string) =>
    setFilter((prev) => ({ ...prev, status, currentPage: 1 }));

  return {
    filter,
    handleSearch,
    onPageChange,
    onRowChange,
    onSortChange,
    onStatusChange,
  };
}

export type UseFilter = {
  filter: Omit<ReturnType<typeof useFilter>, "filter"> &
    ReturnType<typeof useFilter>["filter"];
};
