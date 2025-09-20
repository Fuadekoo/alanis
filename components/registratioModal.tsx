import useAmharic from "@/hooks/useAmharic";
import React from "react";
import {
  Button,
  CModal,
  Form,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ui/heroui";

export default function RegistrationModal({
  isOpen,
  onOpenChange,
  onSubmit,
  validationErrors,
  isLoading,
  children,
  title,
}: {
  isOpen: boolean;
  onOpenChange: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  validationErrors: { [index: string]: string };
  isLoading: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  const isAm = useAmharic();
  return (
    <CModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{ base: "max-w-fit " }}
    >
      <Form onSubmit={onSubmit} validationErrors={validationErrors}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="">
                {title ?? (isAm ? "ምዝገባ" : "Registration")}
              </ModalHeader>
              <ModalBody className="flex flex-col gap-2">{children}</ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {isAm ? "ይመለሱ" : "Back"}
                </Button>
                <Button color="primary" type="submit" isLoading={isLoading}>
                  {isAm ? "ይላኩ" : "Submit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}
