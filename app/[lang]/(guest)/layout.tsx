import React from "react";
import { GuestHeader } from "./header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto scroll-smooth">
      <GuestHeader />
      {children}
    </div>
  );
}
