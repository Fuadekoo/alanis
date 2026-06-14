import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/heroui";

type DetailTabItem = string | { id: string; label: string };

export default function DetailTab({
  tab,
  setTab,
  back,
  tabs = ["profile", "room", "report", "attendance"],
}: {
  tab: string;
  setTab: (id: string) => void;
  back: () => void;
  tabs?: DetailTabItem[];
}) {
  const tabItems = tabs.map((item) =>
    typeof item === "string" ? { id: item, label: item } : item
  );

  return (
    <div className="flex gap-2">
      <Button
        isIconOnly
        variant="flat"
        size="lg"
        onPress={back}
        className="md:hidden bg-default-50/50"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div
        className="flex-1 p-1 bg-default-50/30 rounded-xl grid gap-1"
        style={{ gridTemplateColumns: `repeat(${tabItems.length}, minmax(0, 1fr))` }}
      >
        {tabItems.map(({ id, label }, i) => (
          <Button
            key={i + ""}
            color="primary"
            variant={tab == id ? "flat" : "light"}
            className="capitalize"
            onPress={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
