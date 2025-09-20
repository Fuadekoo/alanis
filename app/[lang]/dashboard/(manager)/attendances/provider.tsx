"use client";

import { useContext } from "@/hooks/useContext";
import { createContext, useState } from "react";

const LayoutContext = createContext<{
  year: number;
  onYear: (value: number) => void;
  month: number;
  onMonth: (value: number) => void;
} | null>(null);

export const useLayout = () => useContext(LayoutContext);

export function Provider({ children }: { children: React.ReactNode }) {
  const [year, onYear] = useState(new Date().getFullYear());
  const [month, onMonth] = useState(new Date().getMonth());

  return (
    <LayoutContext.Provider value={{ year, onYear, month, onMonth }}>
      {children}
    </LayoutContext.Provider>
  );
}
