import useAmharic from "@/hooks/useAmharic";
import RegistrationModal from "./registratioModal";
import useData from "@/hooks/useData";
import { Input, Autocomplete, AutocompleteItem } from "./ui/heroui";
import { TimeInput } from "@heroui/react";
import { parseTime } from "@internationalized/date";
import { UseRegistration } from "@/hooks/useRegistration";
import { registerRoom } from "@/actions/controller/room";

export function AssignRoom({
  idTitle,
  registration,
  getList,
  title,
}: {
  idTitle: string;
  registration: UseRegistration<typeof registerRoom>;
  getList: () => Promise<
    {
      id: string;
      firstName: string;
      fatherName: string;
      lastName: string;
    }[]
  >;
  title: string;
}) {
  const isAm = useAmharic();
  const [data] = useData(getList, () => {});

  return (
    <RegistrationModal
      {...registration}
      title={isAm ? "ክፍል ምደባ" : "Assign Room"}
    >
      <Autocomplete
        label={title}
        placeholder={isAm ? "ፈልግ..." : "Search..."}
        selectedKey={registration.watch(idTitle as "id") || null}
        onSelectionChange={(key) => {
          registration.setValue(idTitle as "id", key as string);
        }}
        defaultItems={data ?? []}
        variant="bordered"
        isClearable
        listboxProps={{
          emptyContent: isAm ? "አልተገኘም" : "Not found",
        }}
        description={
          registration.watch(idTitle as "id")
            ? isAm
              ? "✓ ተመርጧል"
              : "✓ Selected"
            : isAm
            ? "ለመፈለግ መታየብ ይጀምሩ"
            : "Start typing to search"
        }
        classNames={{
          base: registration.watch(idTitle as "id")
            ? "border-2 border-success-300 dark:border-success-600 rounded-lg"
            : "",
        }}
      >
        {(item: {
          id: string;
          firstName: string;
          fatherName: string;
          lastName: string;
        }) => (
          <AutocompleteItem
            key={item.id}
            textValue={`${item.firstName} ${item.fatherName} ${item.lastName}`}
          >
            <div className="flex flex-col py-1">
              <span className="font-medium">
                {item.firstName} {item.fatherName} {item.lastName}
              </span>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
      <TimeInput
        className="w-60"
        label={isAm ? "ሰዓት" : "Time"}
        value={parseTime(registration.watch("time"))}
        onChange={(v) => {
          if (v) {
            registration.setValue("time", v.toString());
          }
        }}
      />
      <Input
        className="w-60"
        label={isAm ? "ቆይታ" : "Duration"}
        variant="bordered"
        {...registration.register("duration")}
      />
    </RegistrationModal>
  );
}
