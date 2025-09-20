import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useSearch() {
  const [search, setSearch] = useState("");
  const handleSearch = useDebouncedCallback(setSearch, 400);

  return { search, handleSearch };
}

export type UseSearch = ReturnType<typeof useSearch>;
