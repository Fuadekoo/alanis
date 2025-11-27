"use client";

import { getTeacherList } from "@/actions/manager/teacher";
import {
  deleteTeacherAnnouncement,
  getTeacherAnnouncements,
  registerTeacherAnnouncement,
} from "@/actions/manager/teacherAnnouncement";
import {
  Button,
  CModal,
  DatePicker,
  Form,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Select,
  SelectItem,
  Skeleton,
  Textarea,
} from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import useData from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
import { teacherAnnouncementSchema } from "@/lib/zodSchema";
import { Spinner } from "@heroui/react";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { X } from "lucide-react";
import React, { useState } from "react";

import { useDebouncedCallback } from "use-debounce";

export default function Page() {
  const isAm = useAmharic();
  const [data, isLoading, refresh] = useData(getTeacherAnnouncements, () => {});
  const form = useRegistration(
    registerTeacherAnnouncement,
    teacherAnnouncementSchema,
    (state) => {
      if (state.status) {
        refresh();
      }
    }
  );
  const deletion = useDelete(deleteTeacherAnnouncement, (state) => {
    if (state.status) {
      refresh();
    }
  });

  return (
    <div className="overflow-hidden grid px-2">
      <div className="md:w-2xl mx-auto grid grid-rows-[auto_1fr] gap-2 overflow-hidden ">
        <div className="p-1 bg-default-50/30 rounded-xl flex gap-2">
          <div className="flex-1"></div>
          <Button color="primary" onPress={() => form.add()}>
            {isAm ? "አዲስ የመምህር ማስታወቂያ" : "New Teacher Announcement"}
          </Button>
        </div>
        {isLoading || !data ? (
          <Skeleton />
        ) : (
          <ScrollShadow className=" py-5 pb-40 flex flex-col gap-10  ">
            {data.map(({ id, text, date, lastDate, forUser }, i) => (
              <div
                key={i + ""}
                className="p-5 shrink-0 bg-default-50/50 rounded-xl "
              >
                <p className="text-sm text-default-500 ">
                  {date.toString().slice(4, 15)}
                </p>
                <p className="">{text}</p>
                <div className="py-5 flex flex-wrap gap-2 ">
                  {forUser.map(({ name }, i) => (
                    <div
                      key={i + ""}
                      className="inline-block py-1 px-3 rounded-full bg-secondary/20 text-secondary-600 "
                    >
                      {name}
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-2 content-center ">
                  <p className="text-sm text-default-500 grid grid-cols-2 gap-2 ">
                    <span className="">last Date </span>
                    <span className="">
                      {lastDate?.toString().slice(4, 15) ?? ""}
                    </span>
                  </p>
                  <div className="flex gap-4 justify-between md:justify-end">
                    <Button
                      variant="flat"
                      color="primary"
                      onPress={() =>
                        form.edit({
                          id,
                          text,
                          lastDate: lastDate ?? undefined,
                          forUser: forUser.map((v) => v.id),
                        })
                      }
                    >
                      {isAm ? "ያስተካክሉ" : "Edit"}
                    </Button>
                    <Button
                      variant="flat"
                      color="danger"
                      onPress={() => deletion.open(id)}
                    >
                      {isAm ? "ይሰርዙ" : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </ScrollShadow>
        )}
      </div>
      <Registration form={form} />
      <Deletion deletion={deletion} />
    </div>
  );
}

function Registration({
  form,
}: {
  form: UseRegistration<typeof registerTeacherAnnouncement>;
}) {
  const isAm = useAmharic();
  const [search, setSearch] = useState("");
  const filter = useDebouncedCallback((value: string) => setSearch(value), 300);
  const [teachers, isLoading] = useData(getTeacherList, () => {}, search);

  return (
    <CModal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
      <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
        <ModalContent>
          {!teachers ? (
            <Skeleton />
          ) : (
            (onClose) => (
              <>
                <ModalHeader>
                  {isAm ? "አዲስ የመምህር ማስታወቂያ" : "New Teacher Announcement"}
                </ModalHeader>
                <ModalBody>
                  <Input
                    onValueChange={filter}
                    placeholder={isAm ? "እዚህ ይፈልጉ ..." : "search here ..."}
                    endContent={
                      isLoading && <Spinner size="sm" className=" " />
                    }
                  />
                  <Select
                    label={isAm ? "መምህሮች" : "Teachers"}
                    labelPlacement="outside"
                    placeholder={isAm ? "ለሁሉም" : "for all"}
                    selectionMode="multiple"
                    value={form.watch("forUser")}
                    onSelectionChange={(v) => {
                      const value = Array.from(v) as string[];
                      form.setValue("forUser", value);
                    }}
                  >
                    {teachers.map(({ id, firstName, fatherName, lastName }) => (
                      <SelectItem key={id}>
                        {`${firstName} ${fatherName} ${lastName}`}
                      </SelectItem>
                    ))}
                  </Select>
                  <Textarea
                    label={isAm ? "ማስታወቂያ" : "Announcement"}
                    labelPlacement="outside"
                    placeholder="type here ..."
                    {...form.register("text")}
                  />
                  <div className=" flex gap-2">
                    <DatePicker
                      className="flex-1"
                      value={
                        form.watch("lastDate")
                          ? parseDate(
                              form
                                .watch("lastDate")
                                ?.toISOString()
                                .split("T")[0] ?? ""
                            )
                          : null
                      }
                      onChange={(v) => {
                        if (v) {
                          form.setValue(
                            "lastDate",
                            v.toDate(getLocalTimeZone())
                          );
                        } else {
                          form.setValue("lastDate", undefined);
                        }
                      }}
                    />
                    <Button
                      isIconOnly
                      variant="flat"
                      color="danger"
                      onPress={() => form.setValue("lastDate", undefined)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    {isAm ? "ይመለሱ" : "Back"}
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={form.isLoading}
                  >
                    {isAm ? "ይመዝግቡ" : "Submit"}
                  </Button>
                </ModalFooter>
              </>
            )
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}

function Deletion({ deletion }: { deletion: UseDelete }) {
  const isAm = useAmharic();

  return (
    <CModal 
      isOpen={deletion.isOpen} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          deletion.close();
        }
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {isAm ? "የመምህር ማስታወቂያ መሰረዝ" : "Teacher Announcement Deletion"}
            </ModalHeader>
            <ModalBody>
              <p className="p-5 text-center ">
                Are you sure, do you want to{" "}
                <span className="text-danger">delete</span> the teacher
                announcement ?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {isAm ? "ይመለሱ" : "Back"}
              </Button>
              <Button
                color="danger"
                onPress={() => {
                  deletion.handle();
                }}
                isLoading={deletion.isLoading}
              >
                {isAm ? "ይሰርዙ" : "Delete"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}

