"use client";

import {
  Button,
  CModal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import React from "react";
import { useStudent } from "./provider";

export default function Approved() {
  const isAm = useAmharic();
  const {
    student: { selected, onApproved, approved, approvedLoading },
  } = useStudent();

  return (
    <CModal isOpen={!!selected} onOpenChange={() => onApproved("")}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-xl font-bold ">
              {isAm ? "አዲስ ተማሪ" : "New Student"}
            </ModalHeader>
            <ModalBody>
              <p className="text-center">
                {isAm
                  ? "እርግጠኛ ነዎት አዲሱን ተማሪ መሰረዝ ይፈልጋሉ?"
                  : "Are you sure you want to delete the new student?"}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {isAm ? "ይመለሱ" : "Back"}
              </Button>
              <Button
                color="primary"
                isLoading={approvedLoading}
                onPress={() => approved(selected)}
              >
                {isAm ? "ያፅድቁ" : "Approve"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </CModal>
  );
}
