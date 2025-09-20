"use client";

import { Input, Select, SelectItem } from "@/components/ui/heroui";
import useAmharic from "@/hooks/useAmharic";
import React from "react";
import { useController } from "./provider";
import RegistrationModal from "@/components/registratioModal";

export default function Registration() {
  const isAm = useAmharic();
  const {
    controller: { registration },
  } = useController();

  return (
    <RegistrationModal
      {...registration}
      title={isAm ? "የተቆጣጣሪ ምዝገባ" : "Controller Registration"}
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
        <Input label={isAm ? "እድሜ" : "Age"} {...registration.register("age")} />
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
    </RegistrationModal>
  );
}
