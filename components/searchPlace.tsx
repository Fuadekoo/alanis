import { cn } from "@heroui/react";
import { Input } from "./ui/heroui";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchPlace({
  placeholder,
  className,
  handleSearch,
  startContent,
  endContent,
}: {
  placeholder?: string;
  className?: string;
  handleSearch: (value: string) => void;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}) {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div
      className={cn(
        "p-1 bg-default-400/20 border border-default-400/80 rounded-xl flex flex-wrap items-center gap-2 md:gap-3",
        className
      )}
    >
      {startContent}
      <Input
        size="sm"
        classNames={{ base: "w-full min-w-0 flex-1", inputWrapper: "bg-default-50/50" }}
        placeholder={
          placeholder ?? lang == "am" ? "እዚህ ይፈልጉ ... " : lang == "or" ? "asitti barbaadi ... " : "search here ... "
        }
        startContent={<Search className="size-4" />}
        onValueChange={handleSearch}
      />
      {endContent}
    </div>
  );
}
