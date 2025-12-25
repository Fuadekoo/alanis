"use client";

import {
  Button,
  ButtonGroup,
  ScrollShadow,
  Skeleton,
} from "@/components/ui/heroui";
import React from "react";
import { useRoom } from "./provider";
import { timeFormat12 } from "@/lib/utils";
import { useParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import Image from "next/image";
import { Announcement } from "./announcement";

export default function List() {
  const { lang } = useParams<{ lang: string }>();
  // const router = useRouter();
  const {
    controller,
    room: { data, isLoading, action, refresh },
  } = useRoom();

  return (
    <div className="p-2 grid gap-5 overflow-hidden auto-rows-min ">
      <Announcement />

      {isLoading || !data ? (
        <Skeleton className="" />
      ) : (
        <ScrollShadow
          size={100}
          className=" p-2 pb-40 border border-default-50/50 rounded-xl  gap-2 grid md:grid-cols-2 xl:grid-cols-3 auto-rows-min "
        >
          {data.map(
            (
              {
                id,
                time,
                teacher: { firstName, fatherName, lastName, gender },
                link,
              },
              i
            ) => (
              <div
                key={i + ""}
                className="p-2 border border-primary/50 bg-default-50/30 rounded-xl grid grid-rows-2 "
              >
                <div className="px-2 font-extrabold text-3xl ">
                  {timeFormat12(time)}
                </div>
                <div className="p-2 capitalize ">
                  {i + 1}{" "}
                  {gender == "Female"
                    ? lang == "am"
                      ? "ከ ኡስታዛ"
                      : lang == "or"
                      ? "irraa ustazah"
                      : "ustazah"
                    : gender == "Male"
                    ? lang == "am"
                      ? "ከ ኡስታዝ"
                      : lang == "or"
                      ? "irraa ustaz"
                      : "ustaz"
                    : ""}{" "}
                  {firstName} {fatherName} {lastName}
                </div>
                <ButtonGroup
                  size="lg"
                  variant="flat"
                  className="gap-[2px] items-stretch overflow-hidden"
                >
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        action(link, id);
                      }}
                      className="h-20 w-full p-2 text-center font-bold bg-primary text-primary-foreground rounded-l-xl flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <p className="text-wrap">
                        {lang == "am"
                          ? "አሁን ሊንክ ተልኮሎዎታል እባክዎ ወደ መማሪያ ክፍሎዎ ይግቡ (እዚህ ይጫኑ)"
                          : lang == "or"
                          ? "Amma linki ergameera maaloo gara kutaa keessaniitti seenaa (as tuqaa)"
                          : "go to classroom"}
                      </p>
                    </a>
                  ) : (
                    <div className="w-full p-2 border border-primary-300 rounded-xl  content-center text-center text-primary-600 ">
                      {lang == "am" ? "ሊንክ አልተላከም" : lang == "or" ? "Linki hin ergamne" : "No Link"}
                    </div>
                  )}
                </ButtonGroup>
              </div>
            )
          )}
          <div className="border border-primary-700  rounded-xl p-5 grid gap-5 place-content-center">
            <p className="">
              {lang == "am"
                ? "መምህሩ ሊንክ የላከ መሆኑን ለማረጋገጥ ከታች ያለውን ይጫኑ። ካልመጣልዎት ትንሽ ጠብቀው በድጋሜ ይሞክሩ። ኡስታዙ ሊንክ ሳይልክ ብዙ ከቆየብዎት ለተቆጣጣሪዎች ሪፖርት ያድርጉ"
                : lang == "or"
                ? "Barsiisaan linki akka erge mirkaneessuuf armaan gadii tuqaa. Yoo hin dhufne xiqqoo eegdanii irra deebi'aa yaalaa. Ustazaan linki osoo hin ergin yeroo dheeraa yoo tureef to'atoota gabaasaa"
                : "Click below to verify that the teacher sent the link."}
            </p>
            {controller?.phoneNumber && (
              <div className="grid gap-2 grid-cols-[1fr_auto_auto]">
                <p className="p-2 border border-primary/30 rounded-xl">
                  {controller.phoneNumber}
                </p>
                <a
                  href={`https://wa.me/${controller.phoneNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-fit p-1 bg-green-500/20 text-green-700 rounded-lg flex items-center justify-center hover:bg-green-500/30 transition-colors"
                >
                  <Image
                    alt=""
                    src={"/whatsapp.svg"}
                    width={100}
                    height={100}
                    className="size-10"
                  />
                </a>
                <a
                  href={`https://t.me/+${controller.phoneNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-fit p-1 bg-sky-500/20 text-sky-700 rounded-lg flex items-center justify-center hover:bg-sky-500/30 transition-colors"
                >
                  <Image
                    alt=""
                    src={"/telegram.svg"}
                    width={100}
                    height={100}
                    className="size-10"
                  />
                </a>
              </div>
            )}
            <Button
              color="primary"
              endContent={<RefreshCcw className="size-4 " />}
              onPress={refresh}
            >
              {lang == "am" ? "ያድሱ" : lang == "or" ? "Haaromsi" : "Refresh"}
            </Button>
          </div>
        </ScrollShadow>
      )}
    </div>
  );
}
