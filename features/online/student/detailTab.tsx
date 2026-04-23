import { ChevronLeft } from "lucide-react";
import { Button, ScrollShadow } from "@/components/ui/heroui";

export default function DetailTab({
  tab,
  setTab,
  back,
}: {
  tab: string;
  setTab: (id: string) => void;
  back: () => void;
}) {
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "notes", label: "Notes" },
    { id: "room", label: "Room" },
    { id: "attendance", label: "Attendance" },
    { id: "tLast", label: "TLast" },
    { id: "cLast", label: "CLast" },
    { id: "payment", label: "Payment" },
  ];

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2  ">
      <Button
        isIconOnly
        variant="flat"
        size="sm"
        onPress={back}
        className="md:hidden h-full bg-default-50/50"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <ScrollShadow
        orientation="horizontal"
        className="flex-1 p-1 bg-default-50/30 rounded-xl flex gap-1 no-scrollbar overflow-x-auto"
      >
        {tabs.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            color="primary"
            variant={tab == id ? "flat" : "light"}
            className="flex-shrink-0 capitalize"
            onPress={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </ScrollShadow>
    </div>
  );
}
