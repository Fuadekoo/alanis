"use client";

import React from "react";
import { Button, ScrollShadow, Skeleton } from "@/components/ui/heroui";
import { Plus, RefreshCw } from "lucide-react";
import SearchPlace from "@/components/searchPlace";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import { useStudent } from "./provider";
import { Chip, cn } from "@heroui/react";
import { highlight, timeFormat12 } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import PullToRefresh from "react-simple-pull-to-refresh";

export default function List() {
  const {
    student: {
      filter,
      data,
      isLoading,
      refresh,
      selected,
      onSelected,
      registration,
    },
    onDetail,
  } = useStudent();
  const isAm = useAmharic();

  // Helper to sanitize phone numbers for messaging links
  const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");
  return (
    <div className="grid gap-5 grid-rows-[auto_1fr_auto] overflow-hidden ">
      <SearchPlace
        handleSearch={filter.handleSearch}
        startContent={
          <>
            <div className="px-2 md:px-4 bg-default-50/50 rounded-lg text-center content-center ">
              {data?.list.length ?? 0}
            </div>
            {/* <Button
              size="sm" 
              className="shrink-0 bg-default-50/50"
              onPress={registration.add.bind(undefined)}
            >
              {"active"}
            </Button> */}
          </>
        }
        endContent={
          <>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="primary"
              className="shrink-0 max-md:hidden"
              onPress={refresh}
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button
              size="sm"
              color="primary"
              className="shrink-0"
              startContent={<Plus className="size-4" />}
              onPress={registration.add.bind(undefined)}
            >
              {isAm ? "አዲስ ተማሪ" : "New Student"}
            </Button>
          </>
        }
      />
      {!data || isLoading ? (
        <Skeleton />
      ) : (
        <PullToRefresh className="grid" onRefresh={async () => refresh()}>
          <ScrollShadow className="p-2 pb-40 bg-default-50/50 border border-default-100/20 rounded-xl grid gap-y-2 gap-x-5 auto-rows-min xl:grid-cols-2 ">
            {data.list.map(
              (
                {
                  id,
                  firstName,
                  fatherName,
                  lastName,
                  phoneNumber,
                  roomStudent,
                  status,
                },
                i
              ) => (
                <div
                  key={i + ""}
                  className={cn(
                    "h-fit p-2 bg-default-50/30 backdrop-blur-sm border-2 rounded-xl flex-col gap-1 items-start ",
                    id == selected
                      ? "border-primary-400 text-primary-600 "
                      : "border-default-400"
                  )}
                >
                  <div className="space-y-2">
                    <Button
                      variant="light"
                      color="primary"
                      className="pl-0 hover:pl-2 capitalize gap-2 justify-between text-lg "
                      onPress={() => {
                        onSelected(id);
                        onDetail(true);
                      }}
                    >
                      <p className="flex-1">
                        {i + 1}{" "}
                        {highlight(
                          `${firstName} ${fatherName} ${lastName}`,
                          filter.search
                        )}
                      </p>
                      {status == "inactive" && (
                        <Chip color={"danger"} variant="flat" className="">
                          {isAm ? "ኢ-ንቁ" : "inactive"}
                        </Chip>
                      )}
                    </Button>
                    {phoneNumber && (
                      <div className="flex gap-2 items-center">
                        <p className="flex-1">{phoneNumber}</p>
                        <Button
                          isIconOnly
                          as={Link}
                          href={`https://t.me/+${sanitizePhone(phoneNumber)}`}
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
                          href={`https://wa.me/${sanitizePhone(phoneNumber)}`}
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
                    {roomStudent && (
                      <div className="flex gap-2 items-center  ">
                        <p className="flex-1">
                          <span className="font-bold">
                            {timeFormat12(roomStudent.time)}
                          </span>{" "}
                          <span className="">for</span>{" "}
                          <span className="font-bold">
                            {roomStudent.duration}
                          </span>{" "}
                          m
                        </p>
                        {roomStudent.link ? (
                          <Button
                            variant="flat"
                            color="primary"
                            className=""
                            as={Link}
                            href={roomStudent.link}
                            target="blank"
                          >
                            {isAm ? "ክፍል" : "room"}
                          </Button>
                        ) : (
                          <div className="p-2 border border-primary/50 rounded-xl">
                            {isAm ? "ሊንክ አልተላከም" : "no link"}
                          </div>
                        )}
                      </div>
                    )}
                    {roomStudent && (
                      <div className="flex gap-2 items-center  ">
                        <p className="flex-1 ">
                          {roomStudent.teacher.firstName}{" "}
                          {roomStudent.teacher.fatherName}{" "}
                          {roomStudent.teacher.lastName}
                        </p>
                        <Chip variant="flat" color="primary">
                          {roomStudent.teacherAttendance
                            ? timeFormat12(roomStudent.teacherAttendance)
                            : "_-_-_-_-"}
                        </Chip>
                        <Chip variant="flat" color="primary">
                          {roomStudent.studentAttendance
                            ? timeFormat12(roomStudent.studentAttendance)
                            : "_-_-_-_-"}
                        </Chip>
                      </div>
                    )}
                    {roomStudent?.teacher.phoneNumber && (
                      <div className="flex gap-2 items-center">
                        <p className="flex-1">
                          {roomStudent.teacher.phoneNumber}
                        </p>
                        <Button
                          isIconOnly
                          as={Link}
                          href={`https://t.me/+${roomStudent.teacher.phoneNumber}`}
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
                          href={`https://wa.me/${roomStudent.teacher.phoneNumber}`}
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
                  </div>
                </div>
              )
            )}
          </ScrollShadow>
        </PullToRefresh>
      )}
      <PaginationPlace
        {...filter}
        totalPage={Math.ceil((data?.totalData ?? 0) / filter.row) || 1}
      />
    </div>
  );
}
