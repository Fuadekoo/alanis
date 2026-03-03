import { changeUserStatus } from "@/actions/common/user";
import useMutation from "@/hooks/useMutation";
import { userStatus } from "@prisma/client";
import { Select, SelectItem } from "./ui/heroui";
import { Chip } from "@heroui/react";

const statusOptions: {
  key: userStatus;
  label: string;
  labelAm: string;
  color: "default" | "primary" | "warning" | "success" | "danger";
}[] = [
  { key: "new", label: "New", labelAm: "አዲስ", color: "default" },
  { key: "onProgress", label: "On Progress", labelAm: "በሂደት ላይ", color: "primary" },
  { key: "remedanLeft", label: "Remedan Left", labelAm: "ረመዳን ያለቀበት", color: "warning" },
  { key: "active", label: "Active", labelAm: "ንቁ", color: "success" },
  { key: "inactive", label: "Inactive", labelAm: "ኢ-ንቁ", color: "danger" },
];



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
    <Select
      size="sm"
      variant="flat"
      aria-label="Status"
      isLoading={isLoading}
      classNames={{
        base: "min-w-40 max-w-xs",
        trigger: "h-9 min-h-9",
      }}
      selectedKeys={new Set([status])}
      onSelectionChange={(v) => {
        const selected = Array.from(v)[0] as userStatus;
        if (selected && selected !== status) {
          action(id, selected);
        }
      }}
      renderValue={() => {
        const current = statusOptions.find((s) => s.key === status);
        return current ? (
          <Chip
            size="sm"
            variant="flat"
            color={current.color}
            className="capitalize"
          >
            {current.label}
          </Chip>
        ) : null;
      }}
    >
      {statusOptions.map((item) => (
        <SelectItem key={item.key} textValue={item.label}>
          <Chip size="sm" variant="flat" color={item.color} className="capitalize">
            {item.label}
          </Chip>
        </SelectItem>
      ))}
    </Select>
  );
}

