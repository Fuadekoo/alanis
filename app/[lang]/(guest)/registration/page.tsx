"use client";

import { register } from "@/actions/common/user";
import { Button, Form, Input } from "@/components/ui/heroui";
import { useRegistration } from "@/hooks/useRegistration";
import { registerSchema } from "@/lib/zodSchema";
import { useParams, useRouter } from "next/navigation";
import React from "react";

export default function Page() {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();
  const form = useRegistration(register, registerSchema, (state) => {
    if (state.status) {
      router.push(`/${lang}/success`);
    }
  });

  return (
    <div className="h-[calc(100dvh-4rem)] p-2 grid place-content-center  ">
      <Form
        onSubmit={form.onSubmit}
        validationErrors={form.validationErrors}
        className="p-5 border border-default-50 rounded-xl grid gap-4 auto-rows-min"
      >
        <Input
          className=""
          color="primary"
          labelPlacement="outside"
          label={lang == "am" ? "ስም" : lang == "or" ? "Maqaa" : "Name"}
          // placeholder={lang == "am" ? "አብደልከሪም አህመድ" : "abdelkerim ahmed"}
          {...form.register("name")}
        />
        <Input
          className=""
          color="primary"
          labelPlacement="outside"
          label={lang == "am" ? "ሀገር" : lang == "or" ? "Biyya" : "Country"}
          // placeholder={lang == "am" ? "ኢትዮጵያ" : "ethiopia"}
          {...form.register("country")}
        />
        <Input
          className=""
          color="primary"
          labelPlacement="outside"
          label={lang == "am" ? "ስልክ ቁጥር" : lang == "or" ? "Lakkoofsa Bilbilaa" : "PhoneNumber"}
          // placeholder="0945467896"
          {...form.register("phoneNumber")}
        />
        <Button color="primary" type="submit">
          {lang == "am" ? "ላክ" : lang == "or" ? "Ergaa" : "Submit"}
        </Button>
      </Form>
    </div>
  );
}
