"use client";

import { addNote, getNotes, deleteNote } from "@/actions/common/notes";
import { Button, ScrollShadow, Skeleton, Textarea } from "@/components/ui/heroui";
import useData from "@/hooks/useData";
import { useStudent } from "./provider";
import { useState } from "react";
import { Trash, MessageSquarePlus } from "lucide-react";
import useAmharic from "@/hooks/useAmharic";
import { useSession } from "next-auth/react";

export default function Notes() {
  const {
    student: { selected },
  } = useStudent();
  const [notes, isLoading, refresh] = useData(getNotes, () => {}, selected);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAm = useAmharic();
  const { data: session } = useSession();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    const res = await addNote(selected, newNote);
    if (res.status) {
      setNewNote("");
      refresh();
    }
    setIsSubmitting(false);
  };

  const handleDeleteNote = async (id: string) => {
    const res = await deleteNote(id);
    if (res.status) {
      refresh();
    }
  };

  const canAddNote =
    session?.user?.role === "controller" || session?.user?.role === "manager";

  return (
    <div className="grid grid-rows-[auto_1fr] gap-4 overflow-hidden h-full">
      {canAddNote && (
        <div className="flex gap-2 items-start p-2 bg-default-50/50 rounded-xl border border-default-100/50">
          <Textarea
            placeholder={isAm ? "ማስታወሻ ይፃፉ..." : "Write a note..."}
            value={newNote}
            onValueChange={setNewNote}
            minRows={1}
            classNames={{ inputWrapper: "bg-transparent h-fit" }}
          />
          <Button
            isIconOnly
            color="primary"
            variant="flat"
            onPress={handleAddNote}
            isLoading={isSubmitting}
            isDisabled={!newNote.trim()}
          >
            <MessageSquarePlus className="size-5" />
          </Button>
        </div>
      )}

      <ScrollShadow className="p-2 flex flex-col gap-2">
        {isLoading ? (
          <div className="grid gap-2">
            {[1, 2, 3].map((v) => (
              <Skeleton key={v} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !notes || notes.length === 0 ? (
          <div className="text-center p-10 text-default-400 italic">
            {isAm ? "ምንም ማስታወሻ የለም" : "No notes yet"}
          </div>
        ) : (
          notes.map((v: any) => (
            <div
              key={v.id}
              className="p-3 bg-default-50/30 rounded-xl border border-default-100 flex flex-col gap-1 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <p className="text-small font-bold text-primary">
                    {v.writenBy.firstName} {v.writenBy.fatherName}
                  </p>
                  <span className="text-[10px] uppercase text-default-400">
                    {v.writenBy.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-default-400">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                  {session?.user?.id === v.writenbyId && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onPress={() => handleDeleteNote(v.id)}
                    >
                      <Trash className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-small whitespace-pre-wrap mt-1">{v.note}</p>
            </div>
          ))
        )}
      </ScrollShadow>
    </div>
  );
}
