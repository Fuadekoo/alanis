export function usePagination(
  setFilter: React.Dispatch<
    React.SetStateAction<{
      search: string;
      sort: boolean;
      currentPage: number;
      row: number;
    }>
  >
) {
  const onSortChange = () =>
    setFilter((prev) => ({ ...prev, sort: !prev.sort }));
  const onPageChange = (currentPage: number) =>
    setFilter((prev) => ({ ...prev, currentPage }));
  const onRowChange = (row: number) => setFilter((prev) => ({ ...prev, row }));

  return { onSortChange, onPageChange, onRowChange };
}

export type UsePagination = ReturnType<typeof usePagination>;
