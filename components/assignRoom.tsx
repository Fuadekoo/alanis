import useAmharic from "@/hooks/useAmharic";
import RegistrationModal from "./registratioModal";
import useData from "@/hooks/useData";
import { Input, Select, SelectItem } from "./ui/heroui";
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
      <Select label={title} {...registration.register(idTitle as "id")}>
        {[...(data ?? [])].map(({ id, firstName, fatherName, lastName }) => (
          <SelectItem key={id}>
            {`${firstName} ${fatherName} ${lastName}`}
          </SelectItem>
        ))}
      </Select>
      <TimeInput
        className="w-60 "
        label={isAm ? "ሰዓት" : "Time"}
        value={parseTime(registration.watch("time"))}
        onChange={(v) => {
          if (v) {
            registration.setValue("time", v.toString());
          }
        }}
      />
      <Input
        className="w-60 "
        label={isAm ? "ቆይታ" : "Duration"}
        {...registration.register("duration")}
      />
    </RegistrationModal>
  );
}
