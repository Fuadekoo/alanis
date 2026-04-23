"use client";

import React from "react";
import { Button, ScrollShadow, Skeleton } from "@/components/ui/heroui";
import {
  BadgeCheck,
  CheckCircle2,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import SearchPlace from "@/components/searchPlace";
import PaginationPlace from "@/components/paginationPlace";
import useAmharic from "@/hooks/useAmharic";
import { useStudent } from "./provider";
import { Chip, cn, Select, SelectItem } from "@heroui/react";
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
    detail: {
      acceptAssignment,
      acceptAssignmentLoading,
      acceptingStudentId,
    },
    onDetail,
  } = useStudent();
  const isAm = useAmharic();

  const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");

  return (
    <div className="grid gap-5 grid-rows-[auto_1fr_auto] overflow-hidden ">
      <SearchPlace
        handleSearch={filter.handleSearch}
        startContent={
          <>
            <Select
              size="sm"
              variant="flat"
              aria-label="Rows per page"
              classNames={{
                base: "w-20",
                trigger: "bg-default-50/50 text-small h-[32px] min-h-[32px]",
              }}
              selectedKeys={new Set([filter.row + ""])}
              onSelectionChange={(v) => {
                const selected = parseInt(Array.from(v)[0] as string);
                if (!Number.isNaN(selected)) filter.onRowChange(selected);
              }}
            >
              {["10", "20", "50", "100", "200", "250"].map((item) => (
                <SelectItem variant="flat" key={item} textValue={item}>
                  {item}
                </SelectItem>
              ))}
            </Select>
            <Select
              size="sm"
              variant="flat"
              placeholder={isAm ? "áˆáŠ”á‰³" : "Status"}
              classNames={{
                base: "min-w-24 max-w-xs",
                trigger: "bg-default-50/50 text-small h-[32px] min-h-[32px]",
              }}
              selectedKeys={new Set([filter.status || "all"])}
              onSelectionChange={(v) => {
                const selected = Array.from(v)[0] as string;
                filter.onStatusChange(selected === "all" ? "" : selected || "");
              }}
            >
              {[
                { key: "all", label: isAm ? "áˆáˆ‰áˆ" : "All" },
                { key: "new", label: isAm ? "áŠ á‹²áˆµ" : "New" },
                {
                  key: "onProgress",
                  label: isAm ? "á‰ áˆ‚á‹°á‰µ áˆ‹á‹­" : "On Progress",
                },
                {
                  key: "remedanLeft",
                  label: isAm
                    ? "áˆ¨áˆ˜á‹³áŠ• á‹«áˆˆá‰€á‰ á‰µ"
                    : "Remedan Left",
                },
                { key: "active", label: isAm ? "áŠ•á‰" : "Active" },
                { key: "inactive", label: isAm ? "áŠ¢-áŠ•á‰" : "Inactive" },
              ].map((item) => (
                <SelectItem
                  variant="flat"
                  key={item.key}
                  textValue={item.label}
                >
                  {item.label}
                </SelectItem>
              ))}
            </Select>
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
              {isAm ? "áŠ á‹²áˆµ" : "add"}
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
                  assignmentState,
                },
                i
              ) => {
                const isControllerView = data.viewerRole === "controller";
                const isPendingAssignment = assignmentState === "pending";
                const isMyStudent = assignmentState === "mine";

                return (
                  <div
                    key={i + ""}
                    className={cn(
                      "h-fit p-2 bg-default-50/30 backdrop-blur-sm border-2 rounded-xl flex-col gap-1 items-start ",
                      id == selected
                        ? "border-primary-400 text-primary-600 "
                        : isPendingAssignment
                        ? "border-warning-300 bg-warning-50/60"
                        : "border-default-400"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="light"
                          color="primary"
                          className="pl-0 hover:pl-2 capitalize gap-2 justify-between text-lg flex-1"
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
                        </Button>

                        {isControllerView && isPendingAssignment ? (
                          <Chip
                            color="warning"
                            variant="flat"
                            startContent={<UserRound className="size-3" />}
                          >
                            {isAm ? "አዲስ" : "New"}
                          </Chip>
                        ) : isControllerView && isMyStudent ? (
                          <Chip
                            color="success"
                            variant="flat"
                            startContent={<BadgeCheck className="size-3" />}
                          >
                            {isAm ? "የኔ ተማሪ" : "My Student"}
                          </Chip>
                        ) : null}

                        {status !== "active" && (
                          <Chip
                            color={
                              status === "inactive"
                                ? "danger"
                                : status === "new"
                                ? "default"
                                : status === "onProgress"
                                ? "primary"
                                : status === "remedanLeft"
                                ? "warning"
                                : "default"
                            }
                            variant="flat"
                          >
                            {status === "inactive"
                              ? isAm
                                ? "áŠ¢-áŠ•á‰"
                                : "Inactive"
                              : status === "new"
                              ? isAm
                                ? "áŠ á‹²áˆµ"
                                : "New"
                              : status === "onProgress"
                              ? isAm
                                ? "á‰ áˆ‚á‹°á‰µ"
                                : "On Progress"
                              : status === "remedanLeft"
                              ? isAm
                                ? "áˆ¨áˆ˜á‹³áŠ•"
                                : "Remedan Left"
                              : status}
                          </Chip>
                        )}
                      </div>

                      {isControllerView && isPendingAssignment && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2">
                          <p className="flex-1 text-sm font-medium text-warning-800">
                            {isAm
                              ? "ይህ ተማሪ እንደ አዲስ ምደባ ወደ እርስዎ ተልኳል። ለመጀመር ያፅድቁት።"
                              : "This student was moved to you and is waiting for your acceptance."}
                          </p>
                          <Button
                            size="sm"
                            color="success"
                            variant="shadow"
                            startContent={<CheckCircle2 className="size-4" />}
                            isLoading={
                              acceptAssignmentLoading &&
                              acceptingStudentId === id
                            }
                            onPress={() => acceptAssignment(id)}
                          >
                            {isAm ? "ያፅድቁ" : "Accept"}
                          </Button>
                        </div>
                      )}

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
                              {isAm ? "áŠ­ááˆ" : "room"}
                            </Button>
                          ) : (
                            <div className="p-2 border border-primary/50 rounded-xl">
                              {isAm ? "áˆŠáŠ•áŠ­ áŠ áˆá‰°áˆ‹áŠ¨áˆ" : "no link"}
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
                );
              }
            )}
          </ScrollShadow>
        </PullToRefresh>
      )}
      <PaginationPlace
        {...filter}
        totalPage={Math.ceil((data?.totalData ?? 0) / filter.row) || 1}
        totalData={data?.totalData ?? 0}
        itemName="students"
      />
    </div>
  );
}
