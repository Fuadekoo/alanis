"use client";

import { Button, Skeleton } from "@/components/ui/heroui";
import { cn } from "@heroui/react";
import React from "react";
import { useChat } from "./provider";
import { useParams } from "next/navigation";

export function List() {
  const {
    user: { role, setRole, data, isLoading, selected, onSelected },
    online,
    isSide,
    setIsSide,
  } = useChat();
  const { lang } = useParams<{ lang: string }>();

  return (
    <div
      className={cn(
        "z-20 md:w-80 xl:w-96 max-md:p-2 md:grid gap-5 grid-rows-[auto_1fr] overflow-hidden ",
        isSide
          ? "max-md:absolute max-md:inset-0 max-md:backdrop-blur-3xl max-md:grid"
          : "max-md:hidden"
      )}
    >
      <div className="p-1 bg-default-50/50 rounded-xl grid gap-1 grid-cols-2">
        {(
          [
            { label: lang == "am" ? "ተማሪ" : lang == "or" ? "Barattoo" : "student", value: "student" },
            { label: lang == "am" ? "መምህር" : lang == "or" ? "Barsiisaa" : "teacher", value: "teacher" },
          ] as const
        ).map(({ label, value }, i) => (
          <Button
            key={i + ""}
            color="primary"
            variant={role == value ? "flat" : "light"}
            className="capitalize"
            onPress={() => setRole(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      {isLoading || !data ? (
        <Skeleton />
      ) : (
        <div className="bg-default-50/50 rounded-xl overflow-auto flex flex-col">
          {data.map(({ id, firstName, fatherName, lastName }, i) => (
            <Button
              key={i + ""}
              size="lg"
              className={cn(
                "px-5 rounded-none justify-start capitalize",
                selected == id
                  ? "bg-primary/50"
                  : "bg-transparent hover:bg-primary/20"
              )}
              startContent={
                <div
                  className={cn(
                    "p-2 rounded-full",
                    online.has(id) ? "bg-success-600" : "bg-danger-600"
                  )}
                />
              }
              onPress={() => {
                onSelected(id);
                setIsSide(false);
              }}
            >
              {firstName} {fatherName} {lastName}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
