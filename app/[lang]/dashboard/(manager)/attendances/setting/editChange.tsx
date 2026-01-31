import { registerDeduction } from "@/actions/manager/attendance";
import { Button, Input } from "@/components/ui/heroui";
import { useRegistration } from "@/hooks/useRegistration";
import { attendanceSetting } from "@/lib/zodSchema";
import { Form, TimeInput } from "@heroui/react";
import { parseTime } from "@internationalized/date";
import { useEffect } from "react";
import { useLayout } from "../provider";
import useAmharic from "@/hooks/useAmharic";

export function EditChange({
  data,
  setEdit,
  refresh,
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
  refresh: () => void;
}) {
  const isAm = useAmharic();
  const { year, month } = useLayout();
  const { register, setValue, watch, onSubmit, validationErrors } =
    useRegistration(registerDeduction, attendanceSetting, (state) => {
      if (state.status) {
        refresh();
      }
    });

  useEffect(() => {
    setValue("year", year);
    setValue("month", month);
    Object.entries(data).forEach(([name, value]) => {
      if (value) {
        setValue(
          name as
            | "year"
            | "month"
            | "whole"
            | "minute"
            | "morningScanStart"
            | "morningWorkStart"
            | "morningWorkEnd"
            | "afternoonScanStart"
            | "afternoonWorkStart"
            | "afternoonWorkEnd",
          value + ""
        );
      }
    });
  }, [data, month, setValue, year]);

  return (
    <Form
      onSubmit={onSubmit}
      validationErrors={validationErrors}
      className="h-fit md:3xl p-5 border border-default-400 rounded-xl grid auto-rows-min gap-5 "
    >
      <div className="text-xl font-bold">
        {isAm ? "አቴንዳንስ ማስተካከያ" : "Attendance Settings"}
      </div>
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <Input
          {...register("whole")}
          label={isAm ? "ሙሉ ተቀናሽ" : "Whole Deduction"}
          endContent={<span>ETB</span>}
        />
        <Input
          {...register("minute")}
          label={isAm ? "በደቂቃ ተቀናሽ" : "Per Minute Deduction "}
        />
        <div className="max-md:hidden"></div>
        <TimeInput
          value={parseTime(watch("morningScanStart"))}
          onChange={(value) =>
            setValue("morningScanStart", value?.toString() ?? "")
          }
          label={isAm ? "የጧት የአቴንዳንስ መጀመሪያ" : "Morning Scan Start"}
        />
        <TimeInput
          value={parseTime(watch("morningWorkStart"))}
          onChange={(value) =>
            setValue("morningWorkStart", value?.toString() ?? "")
          }
          label={isAm ? "የጧት የስራ መጀመሪያ" : "Morning Work Start"}
        />
        <TimeInput
          value={parseTime(watch("morningWorkEnd"))}
          onChange={(value) =>
            setValue("morningWorkEnd", value?.toString() ?? "")
          }
          label={isAm ? "የጧት የስራ መጨረሻ" : "Morning Work End"}
        />
        {/*  */}
        <TimeInput
          value={parseTime(watch("afternoonScanStart"))}
          onChange={(value) =>
            setValue("afternoonScanStart", value?.toString() ?? "")
          }
          label={isAm ? "የከሰዓት የአቴንዳንስ መጀመሪያ" : "Afternoon Scan Start"}
        />
        <TimeInput
          value={parseTime(watch("afternoonWorkStart"))}
          onChange={(value) =>
            setValue("afternoonWorkStart", value?.toString() ?? "")
          }
          label={isAm ? "የከሰዓት የስራ መጀመሪያ" : "Afternoon Work Start"}
        />
        <TimeInput
          value={parseTime(watch("afternoonWorkEnd"))}
          onChange={(value) =>
            setValue("afternoonWorkEnd", value?.toString() ?? "")
          }
          label={isAm ? "የከሰዓት የስራ መጨረሻ" : "Afternoon Work End"}
        />
      </div>
      <div className="w-full flex gap-2 max-md:flex-col-reverse">
        <Button
          className="md:flex-1 shrink-0"
          variant="light"
          onPress={setEdit.bind(undefined, false)}
        >
          {isAm ? "ይመለሱ" : "Back"}
        </Button>
        <Button className="md:flex-1 shrink-0" color="primary" type="submit">
          {isAm ? "ሴቭ" : "Save"}
        </Button>
      </div>
    </Form>
  );
}
