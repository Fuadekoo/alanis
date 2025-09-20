import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useFilter() {
  const [filter, setFilter] = useState({
    search: "",
    sort: true,
    currentPage: 1,
    row: 50,
  });

  const handleSearch = useDebouncedCallback(
    (search: string) => setFilter((prev) => ({ ...prev, search })),
    400
  );

  const onPageChange = (currentPage: number) =>
    setFilter((prev) => ({ ...prev, currentPage }));
  const onRowChange = (row: number) => setFilter((prev) => ({ ...prev, row }));
  const onSortChange = () =>
    setFilter((prev) => ({ ...prev, sort: !prev.sort }));

  return {
    filter,
    handleSearch,
    onPageChange,
    onRowChange,
    onSortChange,
  };
}

export type UseFilter = {
  filter: Omit<ReturnType<typeof useFilter>, "filter"> &
    ReturnType<typeof useFilter>["filter"];
};
