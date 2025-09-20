"use client";

import { useTheme } from "next-themes";
import { Button } from "../ui/heroui";
import { Moon, Sun } from "lucide-react";

export default function Theme() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="">
      <Button
        isIconOnly
        radius="full"
        className="border border-amber-700 bg-amber-500/10 "
        onPress={setTheme.bind(undefined, (prev) =>
          prev == "light" ? "dark" : "light"
        )}
      >
        {theme == "light" ? (
          <Moon className="size-6 stroke-amber-700 fill-amber-700 " />
        ) : (
          <Sun className="size-6 stroke-amber-700 fill-amber-700 " />
        )}
      </Button>
    </div>
  );
}
