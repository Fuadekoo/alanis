import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import React from "react";
import Logout from "./logout";

export default async function Layout({
  children: manager,
  scanner,
  controller,
  teacher,
  student,
}: {
  children: React.ReactNode;
  scanner: React.ReactNode;
  controller: React.ReactNode;
  teacher: React.ReactNode;
  student: React.ReactNode;
}) {
  const session = await auth();
  const data = await prisma.user.findFirst({
    where: { id: session?.user?.id },
    select: { status: true },
  });

  if (!session?.user || data?.status !== "active") {
    return (
      <div className="grid place-content-center gap-5">
        <div className="p-10 bg-danger/10 border border-danger-300 rounded-xl text-danger-600 ">
          <p className="text-2xl first-letter:font-bold ">Oops !!</p>
          <p className="text-sm ">something was wrong</p>
        </div>
        <Logout />
      </div>
    );
  }
  if (session?.user?.role == "manager") return manager;
  else if (session?.user?.role == "scanner") return scanner;
  else if (session?.user?.role == "controller") return controller;
  else if (session?.user?.role == "teacher") return teacher;
  else if (session?.user?.role == "student") return student;
  else
    return (
      <div className="grid place-content-center">
        <div className="p-10 bg-danger/10 border border-danger-300 rounded-xl text-danger-600 ">
          <p className="text-2xl first-letter:font-bold ">Oops !!</p>
          <p className="text-sm ">something was wrong</p>
        </div>
      </div>
    );
}
