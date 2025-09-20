import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/heroui";

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
      <div className="flex-1 p-1 bg-default-50/30 rounded-xl grid gap-1 grid-cols-3">
        {["profile", "room", "attendance"].map((v, i) => (
          <Button
            key={i + ""}
            color="primary"
            variant={tab == v ? "flat" : "light"}
            className="capitalize"
            onPress={() => setTab(v)}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
}
