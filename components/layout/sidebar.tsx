import Logo from "./logo";
import { Button, ScrollShadow } from "../ui/heroui";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import Profile from "./profile";
import React from "react";

export default function SideBar({
  menu,
}: {
  menu: {
    english: string;
    amharic: string;
    url: string;
    Icon: React.JSX.Element;
  }[][];
}) {
  const selected = usePathname().split("/")[3] ?? "";
  const { lang } = useParams<{ lang: string }>();

  return (
    <nav
      className={
        "z-50 lg:grid overflow-hidden max-lg:absolute max-lg:inset-0 max-lg:peer-checked/sidebar:grid max-lg:grid-cols-[auto_1fr] hidden "
      }
    >
      <div className="overflow-hidden max-lg:w-60 lg:w-80 bg-background/50 backdrop-blur-3xl grid grid-rows-[auto_1fr_auto]">
        <Logo />
        <ScrollShadow size={100} className="flex-1 p-5 pb-40 flex flex-col ">
          {menu.map((item, i) => (
            <React.Fragment key={i + ""}>
              {i !== 0 && <hr className=" border-primary" />}
              <div key={i + ""} className="py-5 flex flex-col gap-2 ">
                {item.map(({ english, amharic, url, Icon }, i) => (
                  <Button
                    key={i + ""}
                    size="lg"
                    color="primary"
                    variant={selected == url ? "solid" : "light"}
                    className="shrink-0 justify-start capitalize "
                    startContent={Icon}
                    as={Link}
                    href={`/${lang}/dashboard/${url}`}
                  >
                    {lang == "am" ? amharic : english}
                  </Button>
                ))}
              </div>
            </React.Fragment>
          ))}
        </ScrollShadow>
        <div className="pb-5 px-2 flex gap-2">
          <Profile />
        </div>
      </div>
      <label
        htmlFor="sidebar"
        className="lg:hidden bg-foreground/50 backdrop-blur-sm "
      />
    </nav>
  );
}
