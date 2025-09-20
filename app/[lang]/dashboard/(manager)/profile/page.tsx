import React from "react";
import { ChangePassword } from "./changePassword";
import { ChangeUsername } from "./changeUsername";
import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";

export default async function Page() {
  const controller = await isAuthorized("manager");
  const data = await prisma.user.findFirst({
    where: { id: controller.id },
    select: {
      firstName: true,
      fatherName: true,
      lastName: true,
      gender: true,
      age: true,
      phoneNumber: true,
      country: true,
      username: true,
    },
  });

  if (!data) return null;

  return (
    <div className="p-2 md:p-10 flex flex-col gap-5 text-xl">
      {[
        ["Name", `${data.firstName} ${data.fatherName} ${data.lastName}`],
        ["Gender", data.gender],
        ["Age", +data.age],
        ["Phone Number", data.phoneNumber],
        ["Country", data.country],
      ].map(([label, value], i) => (
        <div key={i + ""} className="md:flex gap-2 items-center ">
          <p className="w-44 max-md:text-sm max-md:text-default-600">{label}</p>
          <p className="capitalize">{value}</p>
        </div>
      ))}
      <ChangeUsername username={data.username} />
      <ChangePassword />
    </div>
  );
}
