import React from "react";
import { GuestHeader } from "./header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto scroll-smooth flex flex-col">
      <GuestHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
