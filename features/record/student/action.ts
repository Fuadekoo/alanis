// "use server";

// import prisma from "@/lib/db";
// import { getError } from "@/lib/utils";
// import { StudentRecordSchema } from "@/lib/zodSchema";
// import { progressStatus } from "@prisma/client";
// import bcrypt from "bcryptjs";

// export async function registerStudent({
//   id,
//   firstName,
//   fatherName,
//   lastName,
//   phoneNumber,
//   username,
//   password,
//   groupId,
// }: StudentRecordSchema) {
//   try {
//     if (id) {
//       const student = await prisma.user.update({
//         where: { id },
//         data: {
//           username,
//           ...(password
//             ? { password: await bcrypt.hash(password || username, 12) }
//             : {}),
//           firstName,
//           fatherName,
//           lastName,
//           phoneNumber,
//         },
//       });
//       await prisma.groupStudent.updateMany({
//         where: { studentId: student.id },
//         data: { groupId },
//       });
//     } else {
//       const student = await prisma.user.create({
//         data: {
//           role: "recordStudent",
//           username,
//           password: await bcrypt.hash(password || username, 12),
//           firstName,
//           fatherName,
//           lastName,
//           phoneNumber,
//         },
//       });
//       await prisma.groupStudent.create({
//         data: { groupId, studentId: student.id },
//       });
//     }
//     return { status: true, message: "successfully register student" };
//   } catch (error) {
//     console.log("HERE >> ", JSON.parse(JSON.stringify(error)));

//     return {
//       status: false,
//       message: getError(error) || "failed to  register student",
//     };
//   }
// }

// export async function deleteStudent(id: string) {
//   await prisma.user.delete({ where: { id, role: "recordStudent" } });
//   return { status: true, message: "successfully deleted" };
// }

// export async function getStudents(search: string) {
//   const temp = await prisma.user
//     .findMany({
//       where: {
//         role: "recordStudent",
//         OR: [
//           { firstName: { contains: search } },
//           { fatherName: { contains: search } },
//           { lastName: { contains: search } },
//         ],
//       },
//       select: {
//         id: true,
//         firstName: true,
//         fatherName: true,
//         lastName: true,
//         phoneNumber: true,
//         username: true,
//         groupStudent: {
//           select: {
//             group: {
//               select: {
//                 id: true,
//                 name: true,
//                 groupTeacher: {
//                   select: {
//                     teacher: {
//                       select: {
//                         id: true,
//                         firstName: true,
//                         fatherName: true,
//                         lastName: true,
//                         phoneNumber: true,
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     })
//     .then((res) =>
//       res.map(
//         ({
//           id,
//           firstName,
//           fatherName,
//           lastName,
//           phoneNumber,
//           username,
//           groupStudent,
//         }) => ({
//           id,
//           firstName,
//           fatherName,
//           lastName,
//           phoneNumber,
//           username,
//           group: groupStudent[0]?.group
//             ? {
//                 id: groupStudent[0].group.id,
//                 name: groupStudent[0].group.name,
//                 teacher: groupStudent[0].group.groupTeacher[0]?.teacher
//                   ? { ...groupStudent[0].group.groupTeacher[0].teacher }
//                   : undefined,
//               }
//             : undefined,
//         })
//       )
//     );

//   return temp;
// }

// export async function getStudentStatus(
//   studentId: string,
//   { year, month }: { year: number; month: number }
// ) {
//   const data: {
//     date: Date;
//     status: progressStatus | "not sent";
//     sentTime?: Date;
//     replayedTime?: Date | null;
//   }[] = [];

//   const today = new Date();
//   const numberOfData =
//     today.getFullYear() == year && today.getMonth() == month
//       ? today.getDate()
//       : new Date(year, month + 1, 0).getDate();

//   for (const i of Array(numberOfData)
//     .fill(null)
//     .map((v, i) => i + 1)) {
//     const startDate = new Date(year, month, i);
//     startDate.setHours(0);
//     startDate.setMinutes(0);
//     const endDate = new Date(year, month, i);
//     endDate.setHours(23);
//     endDate.setMinutes(59);
//     const temp = await prisma.progress.findFirst({
//       where: {
//         studentId,
//         sentTime: {
//           gte: startDate,
//           lte: endDate,
//         },
//       },
//       select: {
//         sentTime: true,
//         status: true,
//         replayedTime: true,
//       },
//     });
//     if (temp) {
//       data.push({
//         date: temp.sentTime,
//         status: temp.status,
//         sentTime: temp.sentTime,
//         replayedTime: temp.replayedTime,
//       });
//     } else {
//       data.push({
//         date: startDate,
//         status: "not sent" as const,
//       });
//     }
//   }

//   return data;
// }

// export async function getGroups() {
//   const data = await prisma.group.findMany({
//     select: { id: true, name: true },
//   });

//   return data;
// }
