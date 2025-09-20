"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/heroui";
import dynamic from "next/dynamic";
import Loading from "@/components/loading";

const Scanner = dynamic(() => import("./scanner"), { ssr: false });

export default function Page() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative grid overflow-hidden ">
      <Scanner setIsLoading={setIsLoading} />
      <div className="z-20 absolute inset-0 grid grid-rows-[1fr_auto] overflow-hidden">
        <div className="grid place-content-center  ">
          <div className="relative mx-auto w-64 aspect-square rounded-xl grid place-content-center [&>div]:border-primary-600 overflow-hidden">
            <div className="absolute inset-0 bg-white/30" />
            {!isLoading && (
              <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-transparent via-primary-500/10 to-primary-500/30 border-r border-primary-600 animate-scan" />
            )}
            {isLoading ? (
              <Loading className="size-32" />
            ) : (
              <Image
                src={"/al-anis.png"}
                alt=""
                width={1000}
                height={1000}
                className="size-12 p-2 bg-white/20 rounded-full content-center"
              />
            )}
          </div>
        </div>
        <div className="p-10 grid">
          <Button
            color="primary"
            as={Link}
            href={`/${pathname
              .split("/")
              .reverse()
              .slice(1)
              .reverse()
              .join("/")}`}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
