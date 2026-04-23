import { BadgeCheck, Clock3, History, UserRound } from "lucide-react";
import useAmharic from "@/hooks/useAmharic";
import { useStudent } from "./provider";
import { Chip } from "@heroui/react";

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

export default function LastControllerHistory() {
  const {
    detail: { data },
  } = useStudent();
  const isAm = useAmharic();
  const history = data?.lastControllers ?? [];

  return (
    <div className="bg-default-50/50 rounded-xl border border-default-200/70 grid grid-rows-[auto_1fr] overflow-hidden">
      <div className="p-4 border-b border-default-200/70 bg-default-100/40 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-warning-100 text-warning-700">
          <History className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">
            {isAm ? "የቀድሞ ተቆጣጣሪዎች" : "Previous Controllers"}
          </p>
          <p className="text-sm text-default-600">
            {isAm
              ? "ተማሪው ከዚህ በፊት ከነበሩ ተቆጣጣሪዎች ጋር የነበረውን ታሪክ ይመልከቱ።"
              : "Review previous controller assignments and when each assignment ended."}
          </p>
        </div>
      </div>

      <div className="overflow-auto">
        {history.length === 0 ? (
          <div className="p-6 text-sm text-default-600">
            {isAm
              ? "እስካሁን የተመዘገበ የቀድሞ ተቆጣጣሪ ታሪክ የለም።"
              : "No previous controller assignments have been recorded for this student yet."}
          </div>
        ) : (
          <div className="divide-y divide-default-200/70">
            {history.map((item, index) => (
              <div key={item.id} className="p-4 grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-warning-100 text-warning-700 grid place-content-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">
                        {item.controller.firstName} {item.controller.fatherName}{" "}
                        {item.controller.lastName}
                      </div>
                      <Chip
                        variant="flat"
                        color="warning"
                        startContent={<Clock3 className="size-3" />}
                      >
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
