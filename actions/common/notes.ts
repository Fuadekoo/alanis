"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function addNote(writentoId: string, note: string) {
  const session = await auth();
  if (!session?.user?.id) return { status: false, message: "Unauthorized" };

  try {
    await prisma.notes.create({
      data: {
        writentoId,
        writenbyId: session.user.id,
        note,
      },
    });
    return { status: true, message: "successfully added note" };
  } catch (error) {
    return { status: false, message: "failed to add note" };
  }
}

export async function getNotes(userId: string) {
  try {
    const data = await prisma.notes.findMany({
      where: { writentoId: userId },
      include: {
        writenBy: {
          select: {
            firstName: true,
            fatherName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return data;
  } catch (error) {
    return [];
  }
}

export async function deleteNote(id: string) {
  try {
    await prisma.notes.delete({ where: { id } });
    return { status: true, message: "successfully deleted note" };
  } catch (error) {
    return { status: false, message: "failed to delete note" };
  }
}
