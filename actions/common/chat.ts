"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { role } from "@prisma/client";

export async function getUserList(role: role) {
  const data = await prisma.user.findMany({
    where: { role, status: { in: ["active", "inactive"] } },
    select: { id: true, firstName: true, fatherName: true, lastName: true },
  });

  return data;
}

export async function getOnline(role: role) {
  const data = await prisma.user
    .findMany({
      where: { role, socket: { not: "" } },
      select: { id: true },
    })
    .then((res) => res.map((v) => v.id));

  return data;
}

export async function deleteChat(id: string) {
  const deleted = await prisma.chat.delete({ where: { id } });
  return {
    status: true,
    message: "successfully message is deleted",
    id: deleted.id,
  };
}

export async function getChat(id: string) {
  const session = await auth();
  const data = await prisma.chat
    .findMany({
      where: {
        OR: [
          { fromId: session?.user?.id, toId: id },
          { fromId: id, toId: session?.user?.id },
        ],
      },
    })
    .then((res) =>
      res
        .sort((a, b) =>
          a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0
        )
        .map((v) => ({ ...v, self: v.fromId == session?.user?.id }))
    );
  return data;
}
