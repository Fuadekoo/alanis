import "server-only";

import prisma from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";

/**
 * Notifications a controller receives about their own student list.
 *
 * A controller has no way of discovering that a student landed on their desk —
 * nothing tells them to go and look — so every assignment raises a push and an
 * inbox row for them.
 */

/** Where the controller lands when they open the notification. */
const CONTROLLER_STUDENTS_URL = "/am/dashboard/student";

function formatStudentName(student: {
  firstName: string | null;
  fatherName: string | null;
  lastName: string | null;
}) {
  return [student.firstName, student.fatherName, student.lastName]
    .filter((part) => !!part?.trim())
    .join(" ")
    .trim();
}

export type ControllerAssignmentNotice = {
  /** The controller receiving the student. Nullish is a no-op. */
  controllerId: string | null | undefined;
  studentId: string;
  /**
   * Who made the change. A controller who assigned the student to themselves
   * already knows, so they are not notified about their own action.
   */
  actorId?: string | null;
  /**
   * True when the student only *moves* once this controller accepts, so the
   * message asks for an action instead of announcing a done deal.
   */
  awaitingAcceptance?: boolean;
};

/**
 * Tell a controller that a student has been assigned to them.
 *
 * Best-effort and never throws: a failed notification must not roll back or
 * fail the assignment that already succeeded.
 */
export async function notifyControllerOfStudentAssignment({
  controllerId,
  studentId,
  actorId,
  awaitingAcceptance = false,
}: ControllerAssignmentNotice) {
  if (!controllerId) return;
  if (actorId && actorId === controllerId) return;

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { firstName: true, fatherName: true, lastName: true },
    });

    if (!student) return;

    const name = formatStudentName(student) || "አዲስ ተማሪ";

    await notifyUsers({
      userIds: [controllerId],
      title: awaitingAcceptance
        ? "👤 አዲስ ተማሪ ማረጋገጫዎን እየጠበቀ ነው"
        : "👤 አዲስ ተማሪ ተመድቦልዎታል!",
      body: awaitingAcceptance
        ? `${name} ወደ እርስዎ ዝርዝር ለመግባት ማረጋገጫዎን እየጠበቀ ነው። / ${name} is waiting for you to accept the assignment.`
        : `${name} የተባለ ተማሪ ተመድቦልዎታል። / ${name} has been assigned to you.`,
      url: CONTROLLER_STUDENTS_URL,
      // Deliberately no dedupeKey: a student can legitimately be assigned to
      // the same controller more than once (moved away and back), and a
      // dedupeKey would silently swallow every assignment after the first.
    });
  } catch (error) {
    console.error(
      "[controllerNotifications] failed to notify controller of assignment:",
      error
    );
  }
}
