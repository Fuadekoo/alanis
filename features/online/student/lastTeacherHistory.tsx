import { BadgeCheck, Clock3, History, UserRound } from "lucide-react";
import useAmharic from "@/hooks/useAmharic";
import { useStudent } from "./provider";
import { Chip } from "@heroui/react";
import { timeFormat12 } from "@/lib/utils";

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

export default function LastTeacherHistory() {
  const {
    detail: { data },
  } = useStudent();
  const isAm = useAmharic();
  const history = data?.lastTeachers ?? [];

  return (
    <div className="bg-default-50/50 rounded-xl border border-default-200/70 grid grid-rows-[auto_1fr] overflow-hidden">
      <div className="p-4 border-b border-default-200/70 bg-default-100/40 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <History className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">
            {isAm ? "የቀድሞ መምህራን" : "Previous Teachers"}
          </p>
          <p className="text-sm text-default-600">
            {isAm
              ? "ተማሪው ከዚህ በፊት የነበሩ መምህራን እና የተለዩበት ጊዜ"
              : "Review former teacher assignments and the time each assignment ended."}
          </p>
        </div>
      </div>

      <div className="overflow-auto">
        {history.length === 0 ? (
          <div className="p-6 text-sm text-default-600">
            {isAm
              ? "እስካሁን የተመዘገበ የቀድሞ መምህር ታሪክ የለም።"
              : "No previous teacher assignments have been recorded for this student yet."}
          </div>
        ) : (
          <div className="divide-y divide-default-200/70">
            {history.map((item, index) => (
              <div key={item.id} className="p-4 grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-content-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">
                        {item.teacher.firstName} {item.teacher.fatherName}{" "}
                        {item.teacher.lastName}
                      </div>
                      <Chip variant="flat" color="danger" startContent={<Clock3 className="size-3" />}>
                        {isAm ? "ተለይቷል" : "Detached"}
                      </Chip>
                    </div>

                    <div className="text-sm text-default-600 grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <UserRound className="size-4" />
                        <span>
                          {isAm ? "ተመድቦ የነበረበት" : "Assigned"}:{" "}
                          {formatDateTime(item.assignedAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <BadgeCheck className="size-4" />
                        <span>
                          {isAm ? "የተለየበት" : "Detached"}:{" "}
                          {formatDateTime(item.detachedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Chip variant="flat" color="primary">
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
