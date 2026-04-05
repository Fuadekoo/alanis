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
import { useParams } from "next/navigation";

export default function UploadLink() {
  const { lang } = useParams<{ lang: string }>();
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
              <ModalHeader>
                {lang == "am"
                  ? "ሊንክ ይስቀሉ"
                  : lang == "or"
                    ? "Linki fe&apos;i"
                    : "Upload Link"}
              </ModalHeader>
              <ModalBody>
                <Textarea
                  placeholder={
                    lang == "am"
                      ? "የክፍል ሊንክ እዚህ ይለጥፉ"
                      : lang == "or"
                        ? "Linki daree asitti fidi"
                        : "Paste class link here"
                  }
                  {...register("link")}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {lang == "am" ? "ተመለስ" : lang == "or" ? "Gara duubaa" : "Back"}
                </Button>
                <Button color="primary" type="submit" isLoading={isLoading}>
                  {lang == "am"
                    ? "አስገባ"
                    : lang == "or"
                      ? "Ergi"
                      : "Submit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Form>
    </CModal>
  );
}
