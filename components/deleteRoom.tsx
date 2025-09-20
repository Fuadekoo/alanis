import useMutation from "@/hooks/useMutation";
import { Button } from "./ui/heroui";
import { Trash } from "lucide-react";

export function DeleteRoom({
  func,
  id,
  refresh,
}: {
  func: (id: string) => Promise<{
    status: boolean;
    message: string;
  }>;
  id: string;
  refresh: () => void;
}) {
  const [roomDelete, roomLoading] = useMutation(func, () => {
    refresh();
  });

  return (
    <Button
      isIconOnly
      size="sm"
      color="danger"
      variant="flat"
      isLoading={roomLoading}
      onPress={roomDelete.bind(undefined, id)}
    >
      <Trash className="size-4" />
    </Button>
  );
}
