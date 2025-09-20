"use client";

import React from "react";
import {
  Button,
  CModal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./ui/heroui";
import useAmharic from "@/hooks/useAmharic";

export default function DeletionModal({
  title,
  isOpen,
  close,
  handle,
  isLoading,
}: {
  title: string;
  description?: string;
  isOpen: boolean;
  close: () => void;
  handle: () => void;
  isLoading: boolean;
}) {
  const isAm = useAmharic();
  return (
    <CModal isOpen={isOpen} onOpenChange={close}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-danger capitalize">
              {isAm ? `የ${title} ስረዛ` : `${title} Deletion`}
            </ModalHeader>
            <ModalBody className="flex ">
              <p className="">
                {isAm ? (
                  <>
                    እርግጠኛ ነዎት {title} <span className="text-danger">መሰረዝ</span>{" "}
                    ይፈልጋሉ? ይህን ካደረጉ እዚህ {title} ጋር የተገናኙ ሁሉም መረጃዎች{" "}
                    <span className="text-danger">ይጠፋሉ</span>
                    <span className="font-extrabold"> !!</span>
                  </>
                ) : (
                  <>
                    Are you sure you want to{" "}
                    <span className="text-danger">delete</span> the {title}? if
                    you do that all related to this {title} data will be{" "}
                    <span className="text-danger">erased</span>
                    <span className="font-extrabold"> !!</span>
                  </>
                )}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {isAm ? "ይመለሱ" : "Back"}
              </Button>
              <Button color="danger" onPress={handle} isLoading={isLoading}>
                {isAm ? "ይሰርዙ" : "Delete"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}
