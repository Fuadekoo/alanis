"use client";

import { Button } from "@/components/ui/heroui";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";

export default function Tab() {
  const { lang } = useParams<{ lang: string }>();
  const selected = usePathname().split("/")[4] ?? "";
  return (
    <div className="p-1 bg-default-50/50 rounded-xl grid gap-2 grid-cols-2">
      {[
        { label: lang == "am" ? "መረጃ" : "Info", url: "" },
        { label: lang == "am" ? "ማስተካከያ" : "Setting", url: "setting" },
      ].map(({ label, url }, i) => (
        <Button
          key={i + ""}
          color="primary"
          variant={selected == url ? "flat" : "light"}
          as={Link}
          href={`/${lang}/dashboard/attendances/${url}`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
