import { changeUserStatus } from "@/actions/common/user";
import useMutation from "@/hooks/useMutation";
import { userStatus } from "@prisma/client";
import { Button } from "./ui/heroui";

export function UserStatus({
  id,
  status,
  refresh,
}: {
  id: string;
  status: userStatus;
  refresh?: () => void;
}) {
  const [action, isLoading] = useMutation(changeUserStatus, () => {
    refresh?.();
  });

  return (
    <Button
      variant="flat"
      color={status == "active" ? "success" : "danger"}
      className=""
      isLoading={isLoading}
      onPress={action.bind(
        undefined,
        id,
        status == "active" ? "inactive" : "active"
      )}
    >
      {status}
    </Button>
  );
}
