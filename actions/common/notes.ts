"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/push";

function amharicGreeting(gender?: string | null) {
  if (gender === "Female") return "እህት";
  if (gender === "Male") return "ወንድም";
  return "";
}

function amharicRole(role?: string | null) {
  switch (role) {
    case "controller":
      return "ተቆጣጣሪ";
    case "teacher":
      return "መምህር";
    case "manager":
      return "ማናጀር";
    default:
      return "";
  }
}

function fullName(user?: {
  firstName?: string | null;
  fatherName?: string | null;
} | null) {
  if (!user) return "";
  return `${user.firstName ?? ""} ${user.fatherName ?? ""}`.trim();
}

/**
 * Best-effort Amharic web push to every manager when a controller reports a
 * note. Never throws: a push failure must not undo the saved note.
 */
async function notifyManagersAboutReportedNote({
  writtenById,
  writtenToId,
  note,
}: {
  writtenById: string;
  writtenToId: string;
  note: string;
}) {
  try {
    const [managers, writer, student] = await Promise.all([
      prisma.user.findMany({
        where: { role: "manager" },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: { id: writtenById },
        select: {
          firstName: true,
          fatherName: true,
          gender: true,
          role: true,
        },
      }),
      prisma.user.findFirst({
        where: { id: writtenToId },
        select: { firstName: true, fatherName: true },
      }),
    ]);

    if (managers.length === 0) return;

    // e.g. "ተቆጣጣሪ ወንድም ከድር ኑረዲን" (Controller Brother Kedir Nuredin)
    const writerName = [
      amharicRole(writer?.role),
      amharicGreeting(writer?.gender),
      fullName(writer),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    // e.g. "ተማሪ ሰአዳ ሙሀመድ" (Student Se'ada Muhammed)
    const studentName = fullName(student)
      ? `ተማሪ ${fullName(student)}`
      : "";

    const body =
      studentName && writerName
        ? `${writerName} ስለ ${studentName} ሪፖርት ልኮልዎታል፦ ${note}`
        : writerName
          ? `${writerName} አዲስ ሪፖርት ልኮልዎታል፦ ${note}`
          : `አዲስ ሪፖርት ደርሶዎታል፦ ${note}`;

    await sendPushToUsers(
      managers.map(({ id }) => id),
      {
        title: "📝 አዲስ ሪፖርት ደርሶዎታል!",
        body,
        url: "/",
      }
    );
  } catch (error) {
    console.error("Failed to push reported note to managers:", error);
  }
}

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

    if (reportToManager) {
      await notifyManagersAboutReportedNote({
        writtenById: session.user.id,
        writtenToId: writentoId,
        note,
      });
    }

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
            roomStudent: {
              select: {
                teacher: {
                  select: {
                    firstName: true,
                    fatherName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { time: "asc" },
              take: 1,
            },
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
