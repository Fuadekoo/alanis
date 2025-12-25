"use client";

import Link from "next/link";
import { Button } from "../ui/heroui";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Languages } from "lucide-react";

export default function Lang() {
  const { lang } = useParams<{ lang: string }>();
  const pathname = usePathname();
  const url = pathname.split("/").slice(2).join("/");

  const languages = [
    { code: "en", label: "English", short: "E" },
    { code: "am", label: "አማርኛ", short: "አ" },
    { code: "or", label: "Afaan Oromo", short: "O" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="shadow"
          className="w-fit px-2 md:px-5 bg-default-50/50 gap-1 text-lg"
          startContent={<Languages className="h-4 w-4" />}
        >
          <span className="">{currentLang.short}</span>
          <span className="max-md:hidden">{currentLang.label}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Language selection">
        {languages.map((language) => (
          <DropdownItem
            key={language.code}
            as={Link}
            href={`/${language.code}/${url}`}
            className={lang === language.code ? "bg-primary/10" : ""}
          >
            {language.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
