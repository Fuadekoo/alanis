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
  inputEndContent,
}: {
  placeholder?: string;
  className?: string;
  handleSearch: (value: string) => void;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  inputEndContent?: React.ReactNode;
}) {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div
      className={cn(
        "p-2 bg-default-400/20 border border-default-400/80 rounded-xl flex flex-col gap-2",
        className
      )}
    >
      {(startContent || endContent) && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {startContent}
          <div className="flex-1 min-w-2" />
          {endContent}
        </div>
      )}
      <div className="flex items-center gap-2 min-w-0">
        <Input
          size="sm"
          classNames={{
            base: "flex-1 min-w-0",
            inputWrapper: "bg-default-50/50",
          }}
          placeholder={
            placeholder ?? lang == "am"
              ? "እዚህ ይፈልጉ ... "
              : lang == "or"
              ? "asitti barbaadi ... "
              : "search here ... "
          }
          startContent={<Search className="size-4 shrink-0" />}
          onValueChange={handleSearch}
        />
        {inputEndContent}
      </div>
    </div>
  );
}
