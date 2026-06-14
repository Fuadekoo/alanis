"use client";

import { Chip } from "@heroui/react";
import {
  BookOpenCheck,
  CalendarClock,
  Clock3,
  History,
  UserRound,
  UsersRound,
} from "lucide-react";
import useAmharic from "@/hooks/useAmharic";
import { timeFormat12 } from "@/lib/utils";

type Person = {
  firstName: string;
  fatherName: string;
  lastName: string;
};

type LastStudent = {
  id: string;
  assignedAt: Date | string;
  detachedAt: Date | string | null;
  time: string;
  duration: number;
  student: Person;
  currentTeacher: (Person & { id: string }) | null;
};

type TeacherHistoryData = Person & {
  room?: unknown[];
  lastStudents?: LastStudent[];
};

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "_-_-_-_-_-";

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fullName(person: Person) {
  return [person.firstName, person.fatherName, person.lastName]
    .filter(Boolean)
    .join(" ");
}

export default function TeacherLastStudentHistory({
  data,
}: {
  data: TeacherHistoryData;
}) {
  const isAm = useAmharic();
  const lastStudents = data.lastStudents ?? [];
  const activeStudentCount = data.room?.length ?? 0;
  const teacherName = fullName(data);

  return (
    <div className="bg-default-50/50 rounded-xl border border-default-200/70 grid grid-rows-[auto_1fr] overflow-hidden">
      <div className="p-4 border-b border-default-200/70 bg-default-100/40 grid gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <History className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold">
              {isAm ? "የቀድሞ ተማሪዎች" : "Previous Students"}
            </p>
            <p className="text-sm text-default-600">
              {isAm
                ? "ከዚህ መምህር የተለዩ የተማሪ ምደባዎችን ይመልከቱ።"
                : "Review student assignments that were detached from this teacher."}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 grid gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary text-primary-foreground grid place-content-center">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase text-primary/70">
                {isAm ? "የአሁኑ መምህር" : "Current Teacher"}
              </p>
              <p className="truncate text-lg font-semibold capitalize">
                {teacherName || "_-_-_-_-"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip
              variant="flat"
              color="primary"
              startContent={<UsersRound className="size-3" />}
            >
              {activeStudentCount} {isAm ? "የአሁን ተማሪ" : "current students"}
            </Chip>
            <Chip
              variant="flat"
              color="warning"
              startContent={<History className="size-3" />}
            >
              {lastStudents.length} {isAm ? "የቀድሞ ተማሪ" : "previous students"}
            </Chip>
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        {lastStudents.length === 0 ? (
          <div className="p-6 text-sm text-default-600">
            {isAm
              ? "እስካሁን የተመዘገበ የቀድሞ ተማሪ ታሪክ የለም።"
              : "No previous student history has been recorded for this teacher yet."}
          </div>
        ) : (
          <div className="divide-y divide-default-200/70">
            {lastStudents.map((item, index) => (
              <div key={item.id} className="p-4 grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-warning-100 text-warning-700 grid place-content-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold capitalize">
                        {fullName(item.student)}
                      </div>
                      <Chip
                        variant="flat"
                        color="warning"
                        startContent={<Clock3 className="size-3" />}
                      >
                        {isAm ? "ተለይቷል" : "Detached"}
                      </Chip>
                    </div>

                    <div className="text-sm text-default-600 grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <UserRound className="size-4" />
                        <span className="font-medium text-default-700">
                          {isAm ? "የአሁኑ መምህር" : "Current teacher"}:
                        </span>
                        {item.currentTeacher ? (
                          <Chip variant="flat" color="success">
                            {fullName(item.currentTeacher)}
                          </Chip>
                        ) : (
                          <Chip variant="flat" color="danger">
                            {isAm ? "መምህር የለም" : "No teacher"}
                          </Chip>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CalendarClock className="size-4" />
                        <span>
                          {isAm ? "ተመድቦ የነበረበት" : "Assigned"}:{" "}
                          {formatDateTime(item.assignedAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Clock3 className="size-4" />
                        <span>
                          {isAm ? "የተለየበት" : "Detached"}:{" "}
                          {formatDateTime(item.detachedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Chip
                        variant="flat"
                        color="primary"
                        startContent={<BookOpenCheck className="size-3" />}
                      >
                        {timeFormat12(item.time)}
                      </Chip>
                      <Chip variant="flat" color="primary">
                        {item.duration} {isAm ? "ደቂቃ" : "min"}
                      </Chip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
