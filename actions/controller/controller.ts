"use server";

import prisma from "@/lib/db";

export async function getControllerList() {
  const data = await prisma.user.findMany({
    where: { role: "controller" },
    select: { id: true, firstName: true, fatherName: true, lastName: true },
  });

  return data;
}
