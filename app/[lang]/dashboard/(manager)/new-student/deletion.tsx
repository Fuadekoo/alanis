"use client";

import DeletionModal from "@/components/deletionModal";
import React from "react";
import { useStudent } from "./provider";
import useAmharic from "@/hooks/useAmharic";

export default function Deletion() {
  const {
    student: { deletion },
  } = useStudent();
  const isAm = useAmharic();

  return <DeletionModal {...deletion} title={isAm ? "ተማሪ" : "student"} />;
}
