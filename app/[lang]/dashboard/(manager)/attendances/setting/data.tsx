import { Button } from "@/components/ui/heroui";
import { timeFormat12 } from "@/lib/utils";
import { Pen } from "lucide-react";

export function Data({
  data,
  setEdit,
}: {
  data: {
    whole: number;
    minute: number;
    morningScanStart: string;
    morningWorkStart: string;
    morningWorkEnd: string;
    afternoonScanStart: string;
    afternoonWorkStart: string;
    afternoonWorkEnd: string;
  };
  setEdit: (value: boolean) => void;
}) {
  return (
    <div className="h-fit grid gap-5 auto-rows-min text-xl">
      <div className="p-2 bg-default-50/50 rounded-xl flex flex-col gap-5">
        {[
          { label: "Whole Deduction", value: `${data.whole} ETB` },
          { label: "Per Minute Deduction", value: `${data.minute} ETB` },
        ].map(({ label, value }, i) => (
          <div key={i + ""} className="grid gap-5 grid-cols-2 items-center">
            <p className=" ">{label}</p>
            <p className="px-5  ">{value}</p>
          </div>
        ))}
      </div>
      <div className="p-2 bg-default-50/50 rounded-xl flex flex-col gap-5">
        {[
          {
            label: "Morning Scan Start",
            value: timeFormat12(data.morningScanStart),
          },
          {
            label: "Morning Work Start",
            value: timeFormat12(data.morningWorkStart),
          },
          {
            label: "Morning Work End",
            value: timeFormat12(data.morningWorkEnd),
          },
        ].map(({ label, value }, i) => (
          <div key={i + ""} className="grid gap-5 grid-cols-2 items-center">
            <p className=" ">{label}</p>
            <p className="px-5  ">{value}</p>
          </div>
        ))}
      </div>
      <div className="p-2 bg-default-50/50 rounded-xl flex flex-col gap-5">
        {[
          {
            label: "Afternoon Scan Start",
            value: timeFormat12(data.afternoonScanStart),
          },
          {
            label: "Afternoon Work Start",
            value: timeFormat12(data.afternoonWorkStart),
          },
          {
            label: "Afternoon Work End",
            value: timeFormat12(data.afternoonWorkEnd),
          },
        ].map(({ label, value }, i) => (
          <div key={i + ""} className="grid gap-5 grid-cols-2 items-center">
            <p className=" ">{label}</p>
            <p className="px-5  ">{value}</p>
          </div>
        ))}
      </div>
      <Button
        color="primary"
        startContent={<Pen className="size-5" />}
        onPress={setEdit.bind(undefined, true)}
      >
        Edit
      </Button>
    </div>
  );
}
