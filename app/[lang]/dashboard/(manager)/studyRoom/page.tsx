"use client";

import {
  deleteStudyRoom,
  getStudyRooms,
  registerStudyRoom,
} from "@/actions/manager/studyRoom";
import {
  Button,
  CModal,
  Form,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Skeleton,
} from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import useData from "@/hooks/useData";
import useDelete, { UseDelete } from "@/hooks/useDelete";
import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
import { studyRoomSchema } from "@/lib/zodSchema";
import React from "react";

export default function Page() {
  const isAm = useAmharic();
  const [data, isLoading, refresh] = useData(getStudyRooms, () => {});
  const form = useRegistration(
    registerStudyRoom,
    studyRoomSchema,
    (state) => {
      if (state.status) {
        refresh();
      }
    }
  );
  const deletion = useDelete(deleteStudyRoom, (state) => {
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
            {isAm ? "አዲስ የመማሪያ ክፍል" : "New Study Room"}
          </Button>
        </div>
        {isLoading || !data ? (
          <Skeleton />
        ) : (
          <ScrollShadow className=" py-5 pb-40 flex flex-col gap-10  ">
            {data.map(({ id, name, zoomLink, createdAt }, i) => (
              <div
                key={i + ""}
                className="p-5 shrink-0 bg-default-50/50 rounded-xl "
              >
                <p className="text-sm text-default-500 ">
                  {new Date(createdAt).toString().slice(4, 15)}
                </p>
                <p className="font-semibold text-lg mb-2">{name}</p>
                <p className="text-sm text-default-600 break-all mb-4">
                  {zoomLink}
                </p>
                <div className="flex gap-4 justify-end">
                  <Button
                    variant="flat"
                    color="primary"
                    onPress={() =>
                      form.edit({
                        id,
                        name,
                        zoomLink,
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
  form: UseRegistration<typeof registerStudyRoom>;
}) {
  const isAm = useAmharic();

  return (
    <CModal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
      <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {isAm ? "አዲስ የመማሪያ ክፍል" : "New Study Room"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label={isAm ? "ስም" : "Name"}
                  labelPlacement="outside"
                  placeholder={isAm ? "የመማሪያ ክፍል ስም" : "Study room name"}
                  {...form.register("name")}
                />
                <Input
                  label={isAm ? "ዩዝም ሊንክ" : "Zoom Link"}
                  labelPlacement="outside"
                  placeholder="https://zoom.us/j/..."
                  type="url"
                  {...form.register("zoomLink")}
                />
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
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}

function Deletion({ deletion }: { deletion: UseDelete }) {
  const isAm = useAmharic();

  return (
    <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {isAm ? "የመማሪያ ክፍል መሰረዝ" : "Study Room Deletion"}
            </ModalHeader>
            <ModalBody>
              <p className="p-5 text-center ">
                Are you sure, do you want to{" "}
                <span className="text-danger">delete</span> this study room ?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {isAm ? "ይመለሱ" : "Back"}
              </Button>
              <Button
                color="danger"
                onPress={deletion.handle}
                isLoading={deletion.isLoading}
              >
                {isAm ? "ይመዝግቡ" : "Submit"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}

