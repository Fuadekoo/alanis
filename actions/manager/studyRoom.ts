"use server";

import prisma from "@/lib/db";
import { StudyRoomSchema } from "@/lib/zodSchema";
import { auth } from "@/lib/auth";

export async function registerStudyRoom({
  id,
  name,
  zoomLink,
}: StudyRoomSchema) {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      status: false,
      message: "Access denied. Only managers can manage study rooms.",
    };
  }

  try {
    if (id) {
      await prisma.studyGroupLink.update({
        where: { id },
        data: { name, zoomLink },
      });
      return {
        status: true,
        message: "Study room updated successfully.",
      };
    } else {
      await prisma.studyGroupLink.create({
        data: { name, zoomLink },
      });
      return {
        status: true,
        message: "Study room created successfully.",
      };
    }
  } catch (error: any) {
    console.error("Failed to create/update study room:", error);
    if (error.code === "P2002") {
      return {
        status: false,
        message: "This zoom link already exists.",
      };
    }
    return {
      status: false,
      message: "Failed to create/update study room.",
    };
  }
}

export async function deleteStudyRoom(id: string) {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return {
      status: false,
      message: "Access denied. Only managers can delete study rooms.",
    };
  }

  try {
    await prisma.studyGroupLink.delete({ where: { id } });
    return {
      status: true,
      message: "Study room deleted successfully.",
    };
  } catch (error) {
    console.error("Failed to delete study room:", error);
    return {
      status: false,
      message: "Failed to delete study room.",
    };
  }
}

export async function getStudyRooms() {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return [];
  }

  const data = await prisma.studyGroupLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  return data;
}

