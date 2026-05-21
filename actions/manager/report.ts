"use server";

import prisma from "@/lib/db";
import { isAuthorized } from "@/lib/utils";
import {
  buildProgressRecord,
  buildProgressStatistics,
  comboProgressInclude,
} from "@/actions/shared/teacherDomain";
import { TeacherStudentStatus } from "@prisma/client";

export async function getReportByTeacher(teacherId: string) {
  try {
    await isAuthorized("manager");

    if (!teacherId) {
      throw new Error("Teacher ID is required");
    }

    const combos = await prisma.teacherStudent.findMany({
      where: {
        teacherId,
      },
      include: comboProgressInclude,
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    });

    const currentProgress = combos
      .filter(
        (combo) =>
          combo.active && combo.status === TeacherStudentStatus.ACTIVE
      )
      .map(buildProgressRecord);

    const historicalProgress = combos
      .filter(
        (combo) =>
          !combo.active || combo.status !== TeacherStudentStatus.ACTIVE
      )
      .map(buildProgressRecord);

    return {
      success: true,
      data: {
        teacher: {
          id: teacherId,
        },
        currentProgress,
        historicalProgress,
        statistics: buildProgressStatistics(
          currentProgress,
          historicalProgress
        ),
      },
      message: "Teacher progress data retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting teacher progress:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher progress",
    };
  }
}
