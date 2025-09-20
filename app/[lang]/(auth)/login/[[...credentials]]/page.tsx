"use client";

import { authenticate } from "@/actions/common/auth";
import Logo from "@/components/layout/logo";
import { Button, Form, Input } from "@/components/ui/heroui";
import { useRegistration } from "@/hooks/useRegistration";
import { loginSchema } from "@/lib/zodSchema";
import { Eye, EyeOff, KeyRound, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Page() {
  const { lang, credentials } = useParams<{
    lang: string;
    credentials?: string[];
  }>();
  const router = useRouter();
  const { onSubmit, validationErrors, register, setValue, isLoading } =
    useRegistration(authenticate, loginSchema, (state) => {
      if (state.status) {
        router.refresh();
      }
    });
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const [username, password] = credentials ?? ["", ""];
    if (username && password) {
      setValue("username", username);
      setValue("password", password);
      onSubmit();
    }
  }, []);

  return (
    <div className="grid place-content-center">
      <Form
        onSubmit={onSubmit}
        validationErrors={validationErrors}
        className="bg-background/40 backdrop-blur-3xl border border-background/30 rounded-xl overflow-hidden grid md:grid-cols-2"
      >
        <div className="p-5 md:p-10 flex gap-5 flex-col bg-background/50 ">
          <div className="flex justify-center ">
            <Logo />
          </div>
          <div className="flex-1 flex flex-col gap-5 justify-center">
            <Input
              variant="faded"
              color="primary"
              placeholder={lang == "am" ? "መለያ ስም" : "Username"}
              className="w-60"
              startContent={<User className="size-6" />}
              {...register("username")}
            />
            <Input
              variant="faded"
              color="primary"
              placeholder={lang == "am" ? "ሚስጥር ቁልፍ" : "Password"}
              className="w-60"
              startContent={<KeyRound className="size-6" />}
              type={hidden ? "password" : "text"}
              endContent={
                <span onClick={() => setHidden((prev) => !prev)}>
                  {hidden ? (
                    <Eye className="size-6" />
                  ) : (
                    <EyeOff className="size-6" />
                  )}
                </span>
              }
              {...register("password")}
            />
            <Button type="submit" color="primary" isLoading={isLoading}>
              {lang == "am" ? "ይግቡ" : "Login"}
            </Button>
          </div>
        </div>
        <div className="max-md:hidden size-full grid place-content-center">
          <Link href={"/"}>
            <Image
              alt=""
              src={"/al-anis.png"}
              width={1000}
              height={1000}
              className="size-40"
            />
          </Link>
        </div>
      </Form>
    </div>
  );
}
