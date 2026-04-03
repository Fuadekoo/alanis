"use client";

import { Button } from "@/components/ui/heroui";
import { Copyright, Dot } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export function Footer() {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();

  return (
    <div
      id="footer"
      className="z-10 h-dvh md:h-[80dvh] p-5 pt-20 grid gap-10 grid-rows-[1fr_auto] bg-primary-800/20 backdrop-blur-3xl "
    >
      <div className="flex max-md:flex-col gap-y-5 gap-x-20 items-center justify-center ">
        <div className="flex-1 grid items-center justify-end  ">
          <Button
            variant="flat"
            color="secondary"
            className="text-3xl font-bold "
          >
            +{process.env.NEXT_PUBLIC_MANAGER_PHONE_NUMBER}
          </Button>
        </div>
        <div className="max-md:hidden text-xl font-bold ">|</div>
        <div className="flex-1 flex gap-2 max-md:flex-col items-center  ">
          <Button
            variant="flat"
            color="primary"
            className="text-3xl font-bold "
            as={Link}
            href={`https://t.me/+${process.env.NEXT_PUBLIC_MANAGER_PHONE_NUMBER}`}
          >
            {lang == "am" ? "ቴሌግራም" : lang == "or" ? "Telegiraam" : "Telegram"}
          </Button>
          <Dot className="size-8 text-primary-700" />
          <Button
            variant="flat"
            color="primary"
            className="text-3xl font-bold "
            as={Link}
            href={`https://wa.me/${process.env.NEXT_PUBLIC_MANAGER_PHONE_NUMBER}`}
          >
            {lang == "am" ? "ዋትስኣፕ" : lang == "or" ? "WhatsApp" : "WhatsApp"}
          </Button>
          <Dot className="size-8 text-primary-700" />
          <Button
            variant="flat"
            color="primary"
            className="text-3xl font-bold "
            as={Link}
            href="https://www.facebook.com/share/18mN72kX4S/"
          >
            {lang == "am" ? "ፌስቡክ" : lang == "or" ? "Facebook" : "Facebook"}
          </Button>
        </div>
      </div>

      <div className="p-5 grid md:grid-cols-2 gap-y-5 gap-x-40 items-center -justify-center ">
        <div className="flex flex-col gap-2 items-center md:items-start">
          <p className="flex gap-2 items-center justify-center  ">
            <span
              className=""
              onClick={() => {
                router.push("/am/screen");
              }}
            >
              2025
            </span>
            <Copyright className="size-4" />
            <span className="">Al Anis</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-primary-700/70">
            <Link href={`/${lang}/mission`} className="hover:text-primary-900 hover:underline">
              {lang == "am" ? "ተልዕኮ" : lang == "or" ? "Ergaa" : "Mission"}
            </Link>
            <Link href={`/${lang}/terms`} className="hover:text-primary-900 hover:underline">
              {lang == "am" ? "ውሎች" : lang == "or" ? "Waliigaltee" : "Terms"}
            </Link>
            <Link href={`/${lang}/support`} className="hover:text-primary-900 hover:underline">
              {lang == "am" ? "ድጋፍ" : lang == "or" ? "Deeggarsa" : "Support"}
            </Link>
            <Link href={`/${lang}/documentation`} className="hover:text-primary-900 hover:underline">
              {lang == "am" ? "ሰነድ" : lang == "or" ? "Galmeewwan" : "Documentation"}
            </Link>
            <Link href={`/${lang}/policy`} className="hover:text-primary-900 hover:underline">
              {lang == "am" ? "ፖሊሲ" : lang == "or" ? "Imaammata" : "Policy"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
