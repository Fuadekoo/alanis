"use client";

import Lang from "@/components/layout/lang";
import Theme from "@/components/layout/theme";
import { Button } from "@/components/ui/heroui";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocalization } from "@/hooks/useLocalization";

export function GuestHeader() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useLocalization();

  return (
    <header className="z-40 sticky top-0 h-14 p-2 bg-background/30 shadow backdrop-blur-3xl flex gap-5 items-center ">
      <div className="shrink-0 px-2 md:px-5 py-3 flex gap-2 items-center  ">
        <Link href={"/"} className=" ">
          <Image
            alt=""
            src={"/al-anis.png"}
            width={100}
            height={100}
            className="size-10 "
          />
        </Link>
        <Link
          href={"/"}
          className="max-md:hidden text-2xl tracking-wider font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          {lang == "am" ? "አል አኒስ" : "Al ANIS"}
        </Link>
      </div>
      <nav className="flex-1"> </nav>
      <Lang />
      <Theme />
      <User />
    </header>
  );
}

function User() {
  const { status } = useSession();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useLocalization();

  return (
    <div className="md:pr-10">
      <Button color="primary" as={Link} href={`/${lang}/login`}>
        {status == "authenticated"
          ? t("navigation.dashboard", "Dashboard")
          : t("navigation.login", "Login")}
      </Button>
    </div>
  );
}
