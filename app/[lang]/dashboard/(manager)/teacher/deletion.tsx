"use client";

import DeletionModal from "@/components/deletionModal";
import React from "react";
import { useTeacher } from "./provider";
import useAmharic from "@/hooks/useAmharic";

export default function Deletion() {
  const {
    teacher: { deletion },
  } = useTeacher();
  const isAm = useAmharic();

  return <DeletionModal {...deletion} title={isAm ? "መምህር" : "teacher"} />;
}
