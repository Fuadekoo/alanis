"use client";

import { Button } from "../ui/heroui";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Button
      isIconOnly
      variant="shadow"
      className="w-fit px-2 md:px-5 bg-default-50/50 gap-1 text-lg"
      onPress={handleRefresh}
    >
      <RefreshCcw className="size-4" />
      <span className="max-md:hidden">Refresh</span>
    </Button>
  );
}
