import Link from "next/link";
import { Button } from "../ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import { usePathname } from "next/navigation";

export default function Lang() {
  const isAm = useAmharic();
  const pathname = usePathname();
  const url = pathname.split("/").slice(2).join("/");

  return (
    <Button
      isIconOnly
      variant="shadow"
      className="w-fit px-2 md:px-5 bg-default-50/50 gap-0 text-lg "
      as={Link}
      href={`/${isAm ? "en" : "am"}/${url}`}
    >
      {isAm ? (
        <>
          <span className="">E</span>
          <span className="max-md:hidden">nglish</span>
        </>
      ) : (
        <>
          <span className="">አ</span>
          <span className="max-md:hidden">ማርኛ</span>
        </>
      )}
    </Button>
  );
}
