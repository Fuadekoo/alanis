"use client";

import { changePassword } from "@/actions/common/auth";
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
import { passwordSchema } from "@/lib/zodSchema";
import { Pen } from "lucide-react";

export function ChangePassword() {
  const {
    add,
    isOpen,
    onOpenChange,
    register,
    onSubmit,
    validationErrors,
    isLoading,
  } = useRegistration(changePassword, passwordSchema);

  return (
    <>
      <div className="md:flex gap-2 items-center ">
        <p className="w-44  max-md:text-sm max-md:text-default-600">Password</p>
        <p className="flex gap-2 ">
          <span className="">********</span>
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
                <ModalHeader>Change Password</ModalHeader>
                <ModalBody className="">
                  <Input placeholder="Password" {...register("password")} />
                  <Input
                    placeholder="Confirm Password"
                    {...register("confirmPassword")}
                  />
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
