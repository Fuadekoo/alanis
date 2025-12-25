"use client";

import { Button } from "@/components/ui/heroui";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function Page() {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="h-[calc(100dvh-4rem)] p-5 grid place-content-center space-y-5">
      <p className="text-center">
        {lang == "am"
          ? "በተሳካ ሁኔታ ተመዝገበዋል። በቅርቡ ከደንበኛ አገልግሎት ይደወልሎታል በትግስት ይጠብቁ።"
          : lang == "or"
          ? "Milkaa'inaan galmaa'amtan. Yeroo dhiyoo tajaajila maamiltootaa irraa bilbilli isiniif ni ta'a, obsaan eegaa."
          : "you are successfully register"}
      </p>
      <p className="text-2xl font-semibold text-center ">0924232389</p>

      <Button
        variant="flat"
        color="primary"
        className="w-60 place-self-center "
        as={Link}
        href={`/${lang}/`}
      >
        {lang == "am" ? "ወደ መግቢያው ይመለሱ" : lang == "or" ? "Gara manatti deebi'aa" : "Back to home"}
      </Button>
    </div>
  );
}
