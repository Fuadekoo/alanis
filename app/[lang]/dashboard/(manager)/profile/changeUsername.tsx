"use client";

import { changeUsername } from "@/actions/common/auth";
import {
  Button,
  CModal,
  Form,
  Input,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/heroui";
import { useRegistration } from "@/hooks/useRegistration";
import { usernameSchema } from "@/lib/zodSchema";
import { Pen } from "lucide-react";
import { useRouter } from "next/navigation";

export function ChangeUsername({ username }: { username: string }) {
  const router = useRouter();
  const {
    add,
    isOpen,
    onOpenChange,
    register,
    onSubmit,
    validationErrors,
    isLoading,
  } = useRegistration(changeUsername, usernameSchema, (state) => {
    if (state.status) {
      router.refresh();
    }
  });

  return (
    <>
      <div className="md:flex gap-2 items-center ">
        <p className="w-44 max-md:text-sm max-md:text-default-600 ">Username</p>
        <p className="flex gap-2 ">
          <span className="">{username}</span>
          <Button
            variant="flat"
            color="primary"
            startContent={<Pen className="size-4" />}
            onPress={add}
          >
            Change
          </Button>
        </p>
      </div>
      <CModal isOpen={isOpen} onOpenChange={onOpenChange}>
        <Form onSubmit={onSubmit} validationErrors={validationErrors}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Change Username</ModalHeader>
                <ModalBody className="">
                  <Input placeholder="Username" {...register("username")} />
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" isLoading={isLoading}>
                    Save
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Form>
      </CModal>
    </>
  );
}
