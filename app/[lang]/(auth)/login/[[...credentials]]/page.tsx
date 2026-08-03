"use client";

import { authenticate } from "@/actions/common/auth";
import Logo from "@/components/layout/logo";
import { Button, Form, Input } from "@/components/ui/heroui";
import { useRegistration } from "@/hooks/useRegistration";
import { loginSchema } from "@/lib/zodSchema";
import { Eye, EyeOff, KeyRound, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";

export default function Page() {
  const { lang, credentials } = useParams<{
    lang: string;
    credentials?: string[];
  }>();
  // Kept true from the moment the login succeeds until the browser leaves the
  // page, so the button never flips back to "Login" while the dashboard loads.
  const [redirecting, setRedirecting] = useState(false);
  const { onSubmit, validationErrors, register, setValue, isLoading } =
    useRegistration(authenticate, loginSchema, (state) => {
      if (state.status) {
        setRedirecting(true);
        // Straight to the dashboard. `router.refresh()` used to re-render the
        // login page and leave it to middleware to bounce the user onward —
        // an extra round trip before the dashboard was even requested. A full
        // navigation also re-renders the root layout, so `SessionProvider`
        // carries the signed-in session that the chat socket and notes read.
        window.location.replace(`/${lang || "am"}/dashboard`);
      }
    });
  const [hidden, setHidden] = useState(true);
  const attemptedLogin = useRef(false);

  useEffect(() => {
    if (attemptedLogin.current) return;
    const [username, password] = credentials ?? ["", ""];
    if (username && password) {
      attemptedLogin.current = true;
      setValue("username", username);
      setValue("password", password);
      setTimeout(() => onSubmit(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials]);

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
              placeholder={lang == "am" ? "መለያ ስም" : lang == "or" ? "Maqaa fayyadamaa" : "Username"}
              className="w-60"
              startContent={<User className="size-6" />}
              {...register("username")}
            />
            <Input
              variant="faded"
              color="primary"
              placeholder={lang == "am" ? "ሚስጥር ቁልፍ" : lang == "or" ? "Jecha icciitii" : "Password"}
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
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading || redirecting}
              isDisabled={redirecting}
            >
              {redirecting
                ? lang == "am"
                  ? "እየገቡ ነው ..."
                  : lang == "or"
                  ? "Seenaa jira ..."
                  : "Signing in ..."
                : lang == "am"
                ? "ይግቡ"
                : lang == "or"
                ? "Seenaa"
                : "Login"}
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
