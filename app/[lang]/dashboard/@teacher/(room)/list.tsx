"use client";

import {
  Button,
  ButtonGroup,
  ScrollShadow,
  Skeleton,
} from "@/components/ui/heroui";
import { addToast } from "@heroui/react";
import { Copy, Pen } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useRoom } from "./provider";
import { timeFormat12 } from "@/lib/utils";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Announcement } from "./announcement";
import ActiveTeaching from "./activeTeaching";

export default function List() {
  const { lang } = useParams<{ lang: string }>();

  const {
    room: { data, isLoading, registration },
  } = useRoom();

  return (
    <div className="p-2 grid gap-5 md:justify-center- auto-rows-min">
      <Announcement />
      <ActiveTeaching />
      {isLoading || !data ? (
        <Skeleton className="md:w-96-" />
      ) : (
        <ScrollShadow
          size={100}
          className="md:w-96- p-2 pb-40 border border-default-50/50 rounded-xl gap-2 grid md:grid-cols-2 xl:grid-cols-3 auto-rows-min"
        >
          {data.map(
            (
              {
                id,
                time,
                student: { firstName, fatherName, lastName, controller },
                link,
              },
              i
            ) => (
              <div
                key={i + ""}
                className="p-2 bg-default-50/30 rounded-xl grid gap-1 grid-rows-2 "
              >
                <div className="px-2 font-extrabold text-3xl ">
                  {timeFormat12(time)}
                </div>
                <div className="p-2 capitalize ">
                  {i + 1} {firstName} {fatherName} {lastName}
                </div>
                {controller?.phoneNumber && (
                  <div className="flex gap-2 items-center">
                    <p className="flex-1">{controller.phoneNumber}</p>
                    <Button
                      isIconOnly
                      as={Link}
                      href={`https://t.me/+${controller.phoneNumber}`}
                      target="blank"
                    >
                      <Image
                        alt=""
                        src={"/telegram.svg"}
                        width={1000}
                        height={1000}
                        className="size-8"
                      />
                    </Button>
                    <Button
                      isIconOnly
                      as={Link}
                      href={`https://wa.me/${controller.phoneNumber}`}
                      target="blank"
                    >
                      <Image
                        alt=""
                        src={"/whatsapp.svg"}
                        width={1000}
                        height={1000}
                        className="size-8"
                      />
                    </Button>
                  </div>
                )}
                <ButtonGroup
                  size="lg"
                  variant="flat"
                  className="gap-[2px] items-stretch overflow-hidden"
                >
                  {link ? (
                    <Button
                      color="primary"
                      className="w-full px-2 justify-start "
                      as={Link}
                      href={link}
                    >
                      {link}
                    </Button>
                  ) : (
                    <div className="w-full p-2 border border-primary-300 rounded-l-xl content-center text-center text-primary-600 ">
                      {lang == "am" ? "ሊንክ አልተላከም" : lang == "or" ? "Linki hin ergamne" : "No Link"}
                    </div>
                  )}
                  {link && (
                    <Button
                      isIconOnly
                      color="primary"
                      onPress={() => {
                        navigator.clipboard
                          .writeText(link)
                          .then(() => {
                            addToast({
                              title: "Success",
                              description: "successfully copied",
                              color: "success",
                            });
                          })
                          .catch(() => {
                            addToast({
                              title: "Error",
                              description: "failed to copied",
                              color: "danger",
                            });
                          });
                      }}
                    >
                      <Copy className="size-4 " />
                    </Button>
                  )}
                  <Button
                    isIconOnly
                    color="primary"
                    onPress={() => registration.edit({ id, link: "" })}
                  >
                    <Pen className="size-4 " />
                  </Button>
                </ButtonGroup>
              </div>
            )
          )}
        </ScrollShadow>
      )}
    </div>
  );
}
