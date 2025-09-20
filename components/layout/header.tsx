import { AlignLeft } from "lucide-react";
import { Button } from "../ui/heroui";
import Lang from "./lang";
import Theme from "./theme";

export default function Header() {
  return (
    <header className="overflow-hidden py-4 px-4 lg:px-10 bg-default-50/30 max-lg:shadow flex gap-2 ">
      <Button
        isIconOnly
        variant="flat"
        color="primary"
        className="lg:hidden"
        as={"label"}
        htmlFor="sidebar"
      >
        <AlignLeft className="size-4" />
      </Button>
      <div className="flex-1"></div>
      <Lang />
      <Theme />
    </header>
  );
}
