"use server";

import { Filter, MutationState } from "@/lib/definitions";
import { getLocalDate, sorting } from "@/lib/utils";
import { StudentSchema } from "@/lib/zodSchema";
import prisma from "@/lib/db";
import {
  closeControllerAssignmentHistory,
  ensureOpenControllerAssignmentHistory,
  isMissingAssignmentHistoryTableError,
} from "@/lib/assignmentHistory";
import {
  getPendingStudentIdsForController,
  getStudentPendingController,
  getStudentPendingControllerState,
  setPendingControllerId,
} from "@/lib/pendingController";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function registerStudent({
  id,
  password,
  ...data
}: StudentSchema): Promise<MutationState> {
  let message = "registration is successfully";

  if (id) {
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    let controllerChangeRequested = false;

    await prisma.$transaction(async (tx) => {
      const existingStudent = await tx.user.findUnique({
        where: { id },
        select: { controllerId: true },
      });

      if (!existingStudent) {
        throw new Error("student not found");
      }

      if (existingStudent.controllerId) {
        await ensureOpenControllerAssignmentHistory(tx, {
          studentId: id,
          controllerId: existingStudent.controllerId,
        });
      }

      controllerChangeRequested =
        !!existingStudent.controllerId &&
        existingStudent.controllerId !== data.controllerId;

      await tx.user.update({
        where: { id },
        data: {
          firstName: data.firstName,
          fatherName: data.fatherName,
          lastName: data.lastName,
          gender: data.gender,
          age: +data.age,
          phoneNumber: data.phoneNumber,
          country: data.country,
          username: data.username,
          startDate: data.startDate ? new Date(data.startDate) : null,
          ...(!controllerChangeRequested
            ? {
                controllerId: data.controllerId,
              }
            : {}),
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
      });

      if (controllerChangeRequested) {
        const supported = await setPendingControllerId(tx, id, data.controllerId);

        if (!supported) {
          throw new Error(
            "pending controller migration is missing. run prisma migration first"
          );
        }
      } else {
        await setPendingControllerId(tx, id, null);
      }

      if (
        data.controllerId &&
        !existingStudent.controllerId
      ) {
        await ensureOpenControllerAssignmentHistory(tx, {
          studentId: id,
          controllerId: data.controllerId,
        });
      }
    });

    if (controllerChangeRequested) {
      message = "controller change is waiting for the new controller to accept";
    }
  } else {
    await prisma.$transaction(async (tx) => {
      const student = await tx.user.create({
        data: {
          role: "student",
          firstName: data.firstName,
          fatherName: data.fatherName,
          lastName: data.lastName,
          gender: data.gender,
          age: +data.age,
          phoneNumber: data.phoneNumber,
          country: data.country,
          username: data.username,
          controllerId: data.controllerId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          password: await bcrypt.hash(password, 12),
        },
      });

      await ensureOpenControllerAssignmentHistory(tx, {
        studentId: student.id,
        controllerId: data.controllerId,
      });
    });
  }

  return { status: true, message };
}

export async function deleteStudent(id: string): Promise<MutationState> {
  return { status: false, message: "deletion is not allowed" };
}

export async function getStudentList(search: string = "") {
  const data = await prisma.user.findMany({
    where: {
      role: "student",
      status: { in: ["active", "inactive"] },
      OR: [
        { firstName: { contains: search } },
        { fatherName: { contains: search } },
        { lastName: { contains: search } },
      ],
    },
    select: { id: true, firstName: true, fatherName: true, lastName: true },
  });

  return data;
}

export async function getStudents({ search, currentPage, row, sort, status }: Filter) {
  const session = await auth();
  const searchClause = [
    { firstName: { contains: search } },
    { fatherName: { contains: search } },
    { lastName: { contains: search } },
    { country: { contains: search } },
  ];
  const baseWhereClause = {
    role: "student" as const,
    ...(status ? { status: status as any } : {}),
    OR: searchClause,
  };
  const studentSelect = {
    id: true,
    firstName: true,
    fatherName: true,
    lastName: true,
    phoneNumber: true,
    status: true,
    controllerId: true,
    roomStudent: {
      select: {
        id: true,
        time: true,
        duration: true,
        link: true,
        updated: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
      take: 1,
    },
  } as const;

  const enrichStudents = async (
    res: Array<{
      id: string;
      firstName: string;
      fatherName: string;
      lastName: string;
      phoneNumber: string;
      status: string;
      controllerId: string | null;
      roomStudent: Array<{
        id: string;
        time: string;
        duration: number;
        link: string;
        updated: Date;
        teacher: {
          id: string;
          firstName: string;
          fatherName: string;
          lastName: string;
          phoneNumber: string;
        };
      }>;
    }>,
    pendingStudentIds: Set<string>
  ) => {
      // Calculate day boundaries in UTC for Ethiopia timezone (UTC+3)
      // Ethiopia midnight (00:00 UTC+3) = 21:00 UTC previous day
      const now = new Date();
      const utcOffset = 3; // Ethiopia is UTC+3
      const startDay = new Date(now);
      startDay.setUTCHours(-utcOffset, 0, 0, 0); // Start of day in Ethiopia = previous day 21:00 UTC
      const endDay = new Date(now);
      endDay.setUTCHours(23 - utcOffset, 59, 59, 999); // End of day in Ethiopia = 20:59 UTC
      return await Promise.all(
        res.map(async ({ roomStudent, ...v }) => {
          const assignmentState =
            session?.user?.role === "controller"
              ? pendingStudentIds.has(v.id)
                ? "pending"
                : v.controllerId === session.user.id
                ? "mine"
                : "other"
              : null;

          if (!roomStudent[0]) {
            return {
              ...v,
              assignmentState,
              roomStudent: null,
            };
          }
          const studentAttendance = await prisma.roomAttendance
            .findFirst({
              where: {
                userId: v.id,
                roomId: roomStudent[0]?.id ?? "none",
                date: { gte: startDay, lte: endDay },
              },
              select: { date: true },
            })
            .then((res) =>
              res?.date ? getLocalDate(res.date).toTimeString().slice(0, 8) : ""
            );
          const teacherAttendance = await prisma.roomAttendance
            .findFirst({
              where: {
                userId: roomStudent[0]?.teacher.id ?? "none",
                roomId: roomStudent[0]?.id ?? "none",
                date: { gte: startDay, lte: endDay },
              },
              select: { date: true },
            })
            .then((res) =>
              res?.date ? getLocalDate(res.date).toTimeString().slice(0, 8) : ""
            );

          return {
            ...v,
            assignmentState,
            roomStudent: {
              ...roomStudent[0],
              link:
                Date.now() - roomStudent[0].updated.getTime() < 40 * 60 * 1000
                  ? roomStudent[0].link
                  : "",
              studentAttendance,
              teacherAttendance,
            },
          };
        })
      );
    };

  if (session?.user?.role === "controller") {
    const activeStudents = await prisma.user.findMany({
      where: {
        ...baseWhereClause,
        controllerId: session.user.id,
      },
      select: studentSelect,
    });

    const pendingStudentIds = await getPendingStudentIdsForController(
      prisma,
      session.user.id
    );
    const pendingStudents =
      pendingStudentIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: {
              ...baseWhereClause,
              id: { in: pendingStudentIds },
            },
            select: studentSelect,
          });

    const mergedStudents = Array.from(
      new Map(
        [...activeStudents, ...pendingStudents].map((student) => [
          student.id,
          student,
        ])
      ).values()
    );
    const pendingStudentIdSet = new Set(pendingStudentIds);
    const enrichedStudents = await enrichStudents(mergedStudents, pendingStudentIdSet);
    const sortedStudents = enrichedStudents.sort((a, b) => {
      if (a.assignmentState !== b.assignmentState) {
        if (a.assignmentState === "pending") return -1;
        if (b.assignmentState === "pending") return 1;
      }

      return sorting(
        a.roomStudent?.time ?? "zzzzzz",
        b.roomStudent?.time ?? "zzzzzzzzzz",
        sort
      );
    });
    const totalData = sortedStudents.length;
    const startIndex = (currentPage - 1) * row;

    return {
      list: sortedStudents.slice(startIndex, startIndex + row),
      totalData,
      viewerRole: session.user.role,
    };
  }

  const list = await prisma.user
    .findMany({
      where: baseWhereClause,
      skip: (currentPage - 1) * row,
      take: row,
      select: studentSelect,
    })
    .then((res) => enrichStudents(res, new Set()))
    .then((res) =>
      res.sort((a, b) =>
        sorting(
          a.roomStudent?.time ?? "zzzzzz",
          b.roomStudent?.time ?? "zzzzzzzzzz",
          sort
        )
      )
    );

  const totalData = await prisma.user.count({
    where: baseWhereClause,
  });

  return { list, totalData, viewerRole: session?.user?.role ?? null };
}

export async function getStudent(id: string) {
  const session = await auth();
  const data = await prisma.user
    .findFirst({
      where: { id },
      include: {
        controller: {
          select: {
            id: true,
            firstName: true,
            fatherName: true,
            lastName: true,
          },
        },
        roomStudent: {
          select: {
            id: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
            time: true,
            duration: true,
            link: true,
            updated: true,
          },
        },
      },
    });

  if (!data) {
    return null;
  }

  const { pendingControllerId, pendingController } =
    await getStudentPendingController(prisma, id);

  let lastTeachers: Array<{
    id: string;
    assignedAt: Date;
    detachedAt: Date | null;
    time: string;
    duration: number;
    teacherId: string;
    teacherFirstName: string;
    teacherFatherName: string;
    teacherLastName: string;
  }> = [];

  try {
    lastTeachers = await prisma.$queryRaw<
      Array<{
        id: string;
        assignedAt: Date;
        detachedAt: Date | null;
        time: string;
        duration: number;
        teacherId: string;
        teacherFirstName: string;
        teacherFatherName: string;
        teacherLastName: string;
      }>
    >`
      SELECT
        tah."id",
        tah."assignedAt",
        tah."detachedAt",
        tah."time",
        tah."duration",
        u."id" AS "teacherId",
        u."firstName" AS "teacherFirstName",
        u."fatherName" AS "teacherFatherName",
        u."lastName" AS "teacherLastName"
      FROM "teacher_assignment_history" tah
      INNER JOIN "user" u
        ON u."id" = tah."teacherId"
      WHERE tah."studentId" = ${id}
        AND tah."detachedAt" IS NOT NULL
      ORDER BY tah."detachedAt" DESC, tah."assignedAt" DESC
    `;
  } catch (error) {
    if (!isMissingAssignmentHistoryTableError(error, "teacher_assignment_history")) {
      throw error;
    }
  }

  let lastControllers: Array<{
    id: string;
    assignedAt: Date;
    detachedAt: Date | null;
    controllerId: string;
    controllerFirstName: string;
    controllerFatherName: string;
    controllerLastName: string;
  }> = [];

  try {
    lastControllers = await prisma.$queryRaw<
      Array<{
        id: string;
        assignedAt: Date;
        detachedAt: Date | null;
        controllerId: string;
        controllerFirstName: string;
        controllerFatherName: string;
        controllerLastName: string;
      }>
    >`
      SELECT
        cah."id",
        cah."assignedAt",
        cah."detachedAt",
        u."id" AS "controllerId",
        u."firstName" AS "controllerFirstName",
        u."fatherName" AS "controllerFatherName",
        u."lastName" AS "controllerLastName"
      FROM "controller_assignment_history" cah
      INNER JOIN "user" u
        ON u."id" = cah."controllerId"
      WHERE cah."studentId" = ${id}
        AND cah."detachedAt" IS NOT NULL
      ORDER BY cah."detachedAt" DESC, cah."assignedAt" DESC
    `;
  } catch (error) {
    if (
      !isMissingAssignmentHistoryTableError(
        error,
        "controller_assignment_history"
      )
    ) {
      throw error;
    }
  }

  return {
    ...data,
    pendingControllerId,
    pendingController,
    requiresControllerAcceptance:
      session?.user?.role === "controller" &&
      pendingControllerId === session.user.id,
    lastTeachers: lastTeachers.map((item) => ({
      id: item.id,
      assignedAt: item.assignedAt,
      detachedAt: item.detachedAt,
      time: item.time,
      duration: item.duration,
      teacher: {
        id: item.teacherId,
        firstName: item.teacherFirstName,
        fatherName: item.teacherFatherName,
        lastName: item.teacherLastName,
      },
    })),
    lastControllers: lastControllers.map((item) => ({
      id: item.id,
      assignedAt: item.assignedAt,
      detachedAt: item.detachedAt,
      controller: {
        id: item.controllerId,
        firstName: item.controllerFirstName,
        fatherName: item.controllerFatherName,
        lastName: item.controllerLastName,
      },
    })),
    room: data.roomStudent
      .map((v) => ({
        ...v,
        link:
          Date.now() - v.updated.getTime() < 40 * 60 * 1000 ? v.link : "",
      }))
      .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0)),
  };
}

export async function acceptStudentControllerAssignment(
  id: string
): Promise<MutationState> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { status: false, message: "you are not authorized" };
    }
    const currentUser = session.user;

    if (!["controller", "manager"].includes(currentUser.role)) {
      return {
        status: false,
        message: "only controllers or managers can accept students",
      };
    }

    await prisma.$transaction(async (tx) => {
      const student = await getStudentPendingControllerState(tx, id);

      if (!student) {
        throw new Error("student not found");
      }

      if (!student.pendingControllerId) {
        throw new Error("there is no pending controller change to accept");
      }

      if (
        currentUser.role === "controller" &&
        student.pendingControllerId !== currentUser.id
      ) {
        throw new Error("you can only accept students assigned to you");
      }

      if (
        student.controllerId &&
        student.controllerId !== student.pendingControllerId
      ) {
        await ensureOpenControllerAssignmentHistory(tx, {
          studentId: student.id,
          controllerId: student.controllerId,
        });

        await closeControllerAssignmentHistory(tx, {
          studentId: student.id,
          controllerId: student.controllerId,
        });
      }

      await tx.user.update({
        where: { id: student.id },
        data: {
          controllerId: student.pendingControllerId,
        },
      });
      const supported = await setPendingControllerId(tx, student.id, null);

      if (!supported) {
        throw new Error(
          "pending controller migration is missing. run prisma migration first"
        );
      }

      await ensureOpenControllerAssignmentHistory(tx, {
        studentId: student.id,
        controllerId: student.pendingControllerId,
      });
    });

    return { status: true, message: "student accepted successfully" };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "failed to accept student assignment",
    };
  }
}
