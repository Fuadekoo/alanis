"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getStudyRoomsForStudent() {
  const session = await auth();
  if (session?.user?.role !== "student") {
    return [];
  }

  const data = await prisma.studyGroupLink.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      zoomLink: true,
      createdAt: true,
    },
  });

  return data;
}

