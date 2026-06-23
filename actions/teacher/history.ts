"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { isMissingAssignmentHistoryTableError } from "@/lib/assignmentHistory";

async function requireTeacherId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "teacher") {
    throw new Error("Access denied");
  }

  return user.id;
}

// Returns the logged-in teacher's previous (detached) students together with
// their detach time, ordered by most recently detached first.
export async function getMyStudentHistory() {
  const id = await requireTeacherId();

  const data = await prisma.user.findFirst({
    where: { id, role: "teacher" },
    select: {
      firstName: true,
      fatherName: true,
      lastName: true,
      roomTeacher: { select: { id: true } },
    },
  });

  if (!data) {
    return null;
  }

  let lastStudents: Array<{
    id: string;
    assignedAt: Date;
    detachedAt: Date | null;
    time: string;
    duration: number;
    studentId: string;
    studentFirstName: string;
    studentFatherName: string;
    studentLastName: string;
  }> = [];

  try {
    lastStudents = await prisma.$queryRaw<
      Array<{
        id: string;
        assignedAt: Date;
        detachedAt: Date | null;
        time: string;
        duration: number;
        studentId: string;
        studentFirstName: string;
        studentFatherName: string;
        studentLastName: string;
      }>
    >`
      SELECT
        tah."id",
        tah."assignedAt",
        tah."detachedAt",
        tah."time",
        tah."duration",
        u."id" AS "studentId",
        u."firstName" AS "studentFirstName",
        u."fatherName" AS "studentFatherName",
        u."lastName" AS "studentLastName"
      FROM "teacher_assignment_history" tah
      INNER JOIN "user" u
        ON u."id" = tah."studentId"
      WHERE tah."teacherId" = ${id}
        AND tah."detachedAt" IS NOT NULL
      ORDER BY tah."detachedAt" DESC, tah."assignedAt" DESC
    `;
  } catch (error) {
    if (
      !isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")
    ) {
      throw error;
    }
  }

  const lastStudentIds = [
    ...new Set(lastStudents.map((item) => item.studentId)),
  ];
  const currentRooms =
    lastStudentIds.length === 0
      ? []
      : await prisma.room.findMany({
          where: { studentId: { in: lastStudentIds } },
          select: {
            studentId: true,
            updated: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
          orderBy: { updated: "desc" },
        });

  const currentTeacherByStudentId = new Map<
    string,
    (typeof currentRooms)[number]["teacher"]
  >();

  currentRooms.forEach((room) => {
    if (!currentTeacherByStudentId.has(room.studentId)) {
      currentTeacherByStudentId.set(room.studentId, room.teacher);
    }
  });

  return {
    firstName: data.firstName,
    fatherName: data.fatherName,
    lastName: data.lastName,
    room: data.roomTeacher,
    lastStudents: lastStudents.map((item) => ({
      id: item.id,
      assignedAt: item.assignedAt,
      detachedAt: item.detachedAt,
      time: item.time,
      duration: item.duration,
      student: {
        id: item.studentId,
        firstName: item.studentFirstName,
        fatherName: item.studentFatherName,
        lastName: item.studentLastName,
      },
      currentTeacher: currentTeacherByStudentId.get(item.studentId) ?? null,
    })),
  };
}
