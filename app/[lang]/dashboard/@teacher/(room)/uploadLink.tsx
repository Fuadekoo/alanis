"use client";

import {
  Button,
  CModal,
  Form,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@/components/ui/heroui";
import { useRoom } from "./provider";

export default function UploadLink() {
  const {
    room: {
      registration: {
        isOpen,
        onOpenChange,
        register,
        onSubmit,
        validationErrors,
        isLoading,
      },
    },
  } = useRoom();

  return (
    <CModal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Form onSubmit={onSubmit} validationErrors={validationErrors}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Link Upload</ModalHeader>
              <ModalBody>
                <Textarea placeholder="copy link here" {...register("link")} />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Back
                </Button>
                <Button color="primary" type="submit" isLoading={isLoading}>
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}
