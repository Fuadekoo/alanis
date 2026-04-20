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
        {["profile", "notes", "room", "attendance", "last", "payment"].map(
          (v, i) => (
          <Button
            key={i + ""}
            size="sm"
            color="primary"
            variant={tab == v ? "flat" : "light"}
            className="flex-shrink-0 capitalize"
            onPress={() => setTab(v)}
          >
            {v}
          </Button>
          )
        )}
      </ScrollShadow>
    </div>
  );
}
