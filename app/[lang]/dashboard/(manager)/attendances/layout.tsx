import YearMonthSelect from "./yearMonthSelect";
import React from "react";
import Tab from "./tab";
import { Provider } from "./provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <div className="relative p-1 md:p-5 grid gap-5 grid-rows-[auto_1fr] overflow-hidden ">
        <div className="p-2 grid gap-2 md:grid-cols-2 items-center">
          <Tab />
          <YearMonthSelect />
        </div>
        {children}
      </div>
    </Provider>
  );
}
