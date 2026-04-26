import { changeUserStatus } from "@/actions/common/user";
import useMutation from "@/hooks/useMutation";
import { userStatus } from "@prisma/client";
import { Chip } from "@heroui/react";
import { Select, SelectItem } from "./ui/heroui";

const statusOptions: {
  key: userStatus;
  label: string;
  labelAm: string;
  color: "default" | "primary" | "warning" | "success" | "danger";
}[] = [
  { key: "new", label: "New", labelAm: "አዲስ", color: "default" },
  {
    key: "onProgress",
    label: "On Progress",
    labelAm: "በሂደት ላይ",
    color: "primary",
  },
  {
    key: "remedanLeft",
    label: "Remedan Left",
    labelAm: "ረመዳን ያለቀበት",
    color: "warning",
  },
  { key: "active", label: "Active", labelAm: "ንቁ", color: "success" },
  {
    key: "inactive",
    label: "Inactive",
    labelAm: "ያልነቃ",
    color: "danger",
  },
];

function getSelectedStatus(value: unknown): userStatus | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value) as userStatus;
  }

  if (
    value &&
    typeof value === "object" &&
    "currentKey" in value &&
    value.currentKey != null
  ) {
    return String(value.currentKey) as userStatus;
  }

  if (
    value &&
    typeof (value as Iterable<unknown>)[Symbol.iterator] === "function"
  ) {
    const selected = Array.from(value as Iterable<unknown>)[0];
    return selected != null ? (String(selected) as userStatus) : undefined;
  }

  return undefined;
}

export function UserStatus({
  id,
  status,
  refresh,
}: {
  id: string;
  status: userStatus;
  refresh?: () => void;
}) {
  const [action, isLoading] = useMutation(changeUserStatus, (state) => {
    if (state.status) {
      refresh?.();
    }
  });

  return (
    <Select
      size="sm"
      variant="flat"
      aria-label="Status"
      isLoading={isLoading}
      classNames={{
        base: "min-w-20 max-w-xs",
        trigger: "h-9 min-h-9",
      }}
      selectedKeys={new Set([status])}
      onSelectionChange={(value) => {
        const selected = getSelectedStatus(value);
        if (selected && selected !== status) {
          action(id, selected);
        }
      }}
      renderValue={() => {
        const current = statusOptions.find((item) => item.key === status);
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
          <Chip
            size="sm"
            variant="flat"
            color={item.color}
            className="capitalize"
          >
            {item.label}
          </Chip>
        </SelectItem>
      ))}
    </Select>
  );
}
