"use client";

import DeletionModal from "@/components/deletionModal";
import React from "react";
import { useController } from "./provider";
import useAmharic from "@/hooks/useAmharic";

export default function Deletion() {
  const {
    controller: { deletion },
  } = useController();
  const isAm = useAmharic();

  return <DeletionModal {...deletion} title={isAm ? "ተቆጣጣሪ" : "controller"} />;
}
