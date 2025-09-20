"use client";

import {
  Button,
  DatePicker,
  Input,
  Select,
  SelectItem,
} from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import React from "react";
import { useStudent } from "./provider";
import RegistrationModal from "@/components/registratioModal";
import useData from "@/hooks/useData";
import { getControllerList } from "@/actions/controller/controller";
import { parseDate } from "@internationalized/date";

export default function Registration() {
  const isAm = useAmharic();
  const [controllers] = useData(getControllerList, () => {});
  const {
    student: { registration },
  } = useStudent();

  return (
    controllers && (
      <RegistrationModal
        {...registration}
        title={isAm ? "የተማሪ ምዝገባ" : "Student Registration"}
      >
        <div className="grid md:grid-cols-3 gap-5">
          <Input
            label={isAm ? "የመጀመሪያ ስም" : "first Name"}
            {...registration.register("firstName")}
            className="w-60"
          />
          <Input
            label={isAm ? "የአባት ስም" : "father Name"}
            {...registration.register("fatherName")}
            className="w-60"
          />
          <Input
            label={isAm ? "የአያት ስም" : "last Name"}
            {...registration.register("lastName")}
            className="w-60"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <Select
            label={isAm ? "ፆታ" : "Gender"}
            {...registration.register("gender")}
          >
            <SelectItem key={"Female"}>{isAm ? "ሴት" : "Female"}</SelectItem>
            <SelectItem key={"Male"}>{isAm ? "ወንድ" : "Male"}</SelectItem>
          </Select>
          <Input
            label={isAm ? "እድሜ" : "Age"}
            {...registration.register("age")}
          />
          <Input
            label={isAm ? "ሀገር" : "country"}
            {...registration.register("country")}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <Input
            label={isAm ? "ስልክ ቁጥር" : "phoneNumber"}
            {...registration.register("phoneNumber")}
          />
          <Input
            label={isAm ? "መለያ ስም" : "username"}
            {...registration.register("username")}
          />
          <Input
            label={isAm ? "ሚስጥር ቁጥር" : "password"}
            {...registration.register("password")}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <DatePicker
            CalendarBottomContent={
              <div className="p-2 flex justify-center ">
                <Button onPress={() => registration.setValue("startDate", "")}>
                  clear
                </Button>
              </div>
            }
            label={isAm ? "የመጀመሪያ ቀን" : "Start Date"}
            value={
              registration.watch("startDate")
                ? parseDate(
                    new Date(registration.watch("startDate")!)
                      .toISOString()
                      .split("T")[0]
                  )
                : undefined
            }
            onChange={(value) => {
              registration.setValue(
                "startDate",
                value ? value.toString() : "",
                {
                  shouldValidate: true,
                }
              );
            }}
          />
          <Select
            label={isAm ? "ተቆጣጣሪ" : "Controller"}
            {...registration.register("controllerId")}
          >
            {controllers.map(({ id, firstName, fatherName, lastName }) => (
              <SelectItem key={id}>
                {`${firstName} ${fatherName} ${lastName}`}
              </SelectItem>
            ))}
          </Select>
          {/* <p className="">{JSON.stringify(registration.validationErrors)}</p> */}
        </div>
      </RegistrationModal>
    )
  );
}
