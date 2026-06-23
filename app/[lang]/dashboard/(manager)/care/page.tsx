"use client";

import { getReportedNotes, resolveNote } from "@/actions/common/notes";
import {
  Button,
  Card,
  CardBody,
  Chip,
  CModal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Select,
  SelectItem,
  Skeleton,
  Textarea,
} from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import useData from "@/hooks/useData";
import { useDisclosure } from "@heroui/react";
import { CheckCircle2, HeartPulse, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

type ReportedNote = {
  id: string;
  note: string;
  status: "OPEN" | "SOLVED" | "UNSOLVED";
  resolutionNote: string | null;
  createdAt: string | Date;
  resolvedAt: string | Date | null;
  writenTo: {
    firstName: string;
    fatherName: string;
    lastName: string;
    username: string | null;
    phoneNumber: string | null;
  };
  writenBy: {
    firstName: string;
    fatherName: string;
    lastName: string;
    role: string;
  };
};

export default function Page() {
  const isAm = useAmharic();
  const [data, isLoading, refresh] = useData(getReportedNotes, () => {});
  const [filter, setFilter] = useState("open");

  const notes = (data?.data ?? []) as ReportedNote[];
  const filtered = notes.filter((n) =>
    filter === "all"
      ? true
      : filter === "open"
      ? n.status === "OPEN"
      : filter === "solved"
      ? n.status === "SOLVED"
      : n.status === "UNSOLVED"
  );

  const openCount = notes.filter((n) => n.status === "OPEN").length;

  return (
    <div className="overflow-hidden grid px-2 h-full">
      <div className="md:w-2xl mx-auto w-full grid grid-rows-[auto_1fr] gap-3 overflow-hidden">
        <div className="p-2 bg-default-50/30 rounded-xl flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <HeartPulse className="size-6 text-primary" />
            <h1 className="text-lg font-bold">
              {isAm ? "የተማሪ እንክብካቤ" : "Student Care"}
            </h1>
            {openCount > 0 && (
              <Chip size="sm" color="warning" variant="flat">
                {openCount} {isAm ? "አዲስ" : "open"}
              </Chip>
            )}
          </div>
          <Select
            aria-label="filter"
            selectedKeys={new Set([filter])}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              if (value) setFilter(value);
            }}
            className="w-40"
            size="sm"
            variant="bordered"
          >
            <SelectItem key="open">{isAm ? "ያልተፈቱ" : "Open"}</SelectItem>
            <SelectItem key="solved">{isAm ? "የተፈቱ" : "Solved"}</SelectItem>
            <SelectItem key="unsolved">
              {isAm ? "ያልተፈቱ (የተመረመሩ)" : "Not Solved"}
            </SelectItem>
            <SelectItem key="all">{isAm ? "ሁሉም" : "All"}</SelectItem>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-3 py-3">
            {[1, 2, 3].map((v) => (
              <Skeleton key={v} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-10 text-default-400 italic">
            {isAm ? "ምንም ሪፖርት የለም" : "No reported problems"}
          </div>
        ) : (
          <ScrollShadow className="py-3 pb-40 flex flex-col gap-3">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onResolved={refresh} />
            ))}
          </ScrollShadow>
        )}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onResolved,
}: {
  note: ReportedNote;
  onResolved: () => void;
}) {
  const isAm = useAmharic();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [solved, setSolved] = useState(true);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const studentName = `${note.writenTo.firstName} ${note.writenTo.fatherName} ${note.writenTo.lastName}`;
  const controllerName = `${note.writenBy.firstName} ${note.writenBy.fatherName}`;
  const studentPhone = (note.writenTo.phoneNumber || "").replace(/\D/g, "");

  const statusChip = () => {
    if (note.status === "SOLVED")
      return (
        <Chip size="sm" color="success" variant="flat">
          {isAm ? "ተፈትቷል" : "Solved"}
        </Chip>
      );
    if (note.status === "UNSOLVED")
      return (
        <Chip size="sm" color="danger" variant="flat">
          {isAm ? "አልተፈታም" : "Not Solved"}
        </Chip>
      );
    return (
      <Chip size="sm" color="warning" variant="flat">
        {isAm ? "በመጠባበቅ ላይ" : "Awaiting Diagnosis"}
      </Chip>
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await resolveNote(note.id, solved, resolutionNote);
    setIsSaving(false);
    if (res.status) {
      onClose();
      setResolutionNote("");
      onResolved();
    }
  };

  return (
    <Card className="shrink-0 border border-default-100">
      <CardBody className="gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col">
            <p className="font-bold text-primary">{studentName}</p>
            <span className="text-[11px] text-default-400">
              {isAm ? "በ" : "by"} {controllerName} ·{" "}
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
          {statusChip()}
        </div>

        {studentPhone && (
          <div className="flex gap-2 items-center bg-success-50/60 border border-success-100 rounded-xl px-3 py-1.5">
            <p className="flex-1 font-medium text-default-600">
              {note.writenTo.phoneNumber}
            </p>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              as={Link}
              href={`https://t.me/+${studentPhone}`}
              target="_blank"
              title="Telegram"
            >
              <Image
                alt="Telegram"
                src="/telegram.svg"
                width={1000}
                height={1000}
                className="size-7"
              />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              as={Link}
              href={`https://wa.me/${studentPhone}`}
              target="_blank"
              title="WhatsApp"
            >
              <Image
                alt="WhatsApp"
                src="/whatsapp.svg"
                width={1000}
                height={1000}
                className="size-7"
              />
            </Button>
          </div>
        )}

        <p className="text-small whitespace-pre-wrap">{note.note}</p>

        {note.resolutionNote && (
          <div className="p-2 rounded-lg bg-default-100/60 border border-default-200/60">
            <p className="text-[10px] uppercase text-default-400">
              {isAm ? "ምርመራ / ምላሽ" : "Diagnosis / Response"}
            </p>
            <p className="text-small whitespace-pre-wrap">
              {note.resolutionNote}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            color={note.status === "OPEN" ? "primary" : "default"}
            variant="flat"
            onPress={() => {
              setSolved(true);
              setResolutionNote(note.resolutionNote ?? "");
              onOpen();
            }}
          >
            {note.status === "OPEN"
              ? isAm
                ? "ምርመራ አድርግ"
                : "Diagnose"
              : isAm
              ? "አስተካክል"
              : "Update"}
          </Button>
        </div>
      </CardBody>

      <CModal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                {isAm ? "ምርመራ ውጤት" : "Diagnosis Result"}
              </ModalHeader>
              <ModalBody>
                <p className="text-small text-default-500">{studentName}</p>
                <p className="text-small whitespace-pre-wrap p-2 rounded-lg bg-default-50">
                  {note.note}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    color="success"
                    variant={solved ? "solid" : "bordered"}
                    startContent={<CheckCircle2 className="size-4" />}
                    onPress={() => setSolved(true)}
                  >
                    {isAm ? "ተፈትቷል" : "Solved"}
                  </Button>
                  <Button
                    className="flex-1"
                    color="danger"
                    variant={!solved ? "solid" : "bordered"}
                    startContent={<XCircle className="size-4" />}
                    onPress={() => setSolved(false)}
                  >
                    {isAm ? "አልተፈታም" : "Not Solved"}
                  </Button>
                </div>
                <Textarea
                  label={isAm ? "ማስታወሻ (አማራጭ)" : "Note (optional)"}
                  labelPlacement="outside"
                  placeholder={
                    isAm ? "ምን እንደተደረገ ይፃፉ..." : "Describe what was done..."
                  }
                  value={resolutionNote}
                  onValueChange={setResolutionNote}
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {isAm ? "ይመለሱ" : "Back"}
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={isSaving}
                >
                  {isAm ? "አስቀምጥ" : "Save"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </CModal>
    </Card>
  );
}
