"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function addNote(
  writentoId: string,
  note: string,
  reportToManager = false
) {
  const session = await auth();
  if (!session?.user?.id) return { status: false, message: "Unauthorized" };

  try {
    await prisma.notes.create({
      data: {
        writentoId,
        writenbyId: session.user.id,
        note,
        reportedToManager: reportToManager,
        status: "OPEN",
      },
    });
    return {
      status: true,
      message: reportToManager
        ? "successfully added note and reported to manager"
        : "successfully added note",
    };
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

/**
 * Manager view: all notes a controller has reported to the manager, with the
 * student they are about and the controller who reported them. Unresolved
 * (OPEN) problems come first, then most recent.
 */
export async function getReportedNotes() {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return { status: false, message: "Unauthorized", data: [] };
  }

  try {
    const data = await prisma.notes.findMany({
      where: { reportedToManager: true },
      include: {
        writenTo: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            username: true,
            phoneNumber: true,
          },
        },
        writenBy: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return { status: true, data };
  } catch (error) {
    return { status: false, message: "failed to load reported notes", data: [] };
  }
}

/**
 * Manager diagnosis result for a reported problem: solved or not solved.
 */
export async function resolveNote(
  id: string,
  solved: boolean,
  resolutionNote?: string
) {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return { status: false, message: "Unauthorized" };
  }

  try {
    await prisma.notes.update({
      where: { id },
      data: {
        status: solved ? "SOLVED" : "UNSOLVED",
        resolutionNote: resolutionNote?.trim() || null,
        resolvedAt: new Date(),
      },
    });
    return {
      status: true,
      message: solved ? "marked as solved" : "marked as not solved",
    };
  } catch (error) {
    return { status: false, message: "failed to update note" };
  }
}
