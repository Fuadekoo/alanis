// "use server";

// import prisma from "@/lib/db";
// import bcrypt from "bcryptjs";
// import { AssignSchema, TeacherSchema } from "./schema";

// export async function registerTeacher({
//   id,
//   firstName,
//   fatherName,
//   lastName,
//   phoneNumber,
//   username,
//   password,
//   groupId,
// }: TeacherSchema) {
//   if (id) {
//     await prisma.user.update({
//       where: { id },
//       data: {
//         firstName,
//         fatherName,
//         lastName,
//         phoneNumber,
//         username,
//         ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
//         groupTeacher: {
//           updateMany: {
//             where: { groupId: { not: groupId } },
//             data: { groupId },
//           },
//         },
//       },
//     });
//   } else {
//     await prisma.user.create({
//       data: {
//         role: "recordTeacher",
//         firstName,
//         fatherName,
//         lastName,
//         phoneNumber,
//         username,
//         password: await bcrypt.hash(password ?? "", 12),
//         groupTeacher: {
//           create: { groupId },
//         },
//       },
//     });
//   }
//   return { status: true, message: "successfully register teacher" };
// }

// export async function deleteTeacher(id: string) {
//   await prisma.user.delete({ where: { id, role: "recordTeacher" } });

//   return { status: true, message: "successfully delete teacher" };
// }

// export async function getTeachers(search: string) {
//   const data = await prisma.user
//     .findMany({
//       where: {
//         role: "recordTeacher",
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
//         groupTeacher: {
//           select: {
//             group: {
//               select: {
//                 id: true,
//                 name: true,
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
//           groupTeacher: [groupTeacher],
//         }) => ({
//           id,
//           firstName,
//           fatherName,
//           lastName,
//           phoneNumber,
//           username,
//           group: groupTeacher?.group as
//             | (typeof groupTeacher)["group"]
//             | undefined,
//         })
//       )
//     );

//   return data;
// }

// export async function getStudentStatus(
//   teacherId: string,
//   {
//     date,
//     search,
//   }: {
//     date: Date;
//     search: string;
//   }
// ) {
//   const startDate = new Date(date.toISOString().split("T")[0]);
//   const endDate = new Date(date.toISOString().split("T")[0]);
//   endDate.setHours(23);
//   endDate.setMinutes(59);
//   const data = await prisma.user
//     .findMany({
//       where: {
//         role: "recordStudent",
//         groupStudent: {
//           every: { group: { groupTeacher: { some: { teacherId } } } },
//         },
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
//       },
//     })
//     .then(async (res) => {
//       return await Promise.all(
//         res.map(async ({ id, firstName, fatherName, lastName }) => {
//           const temp = await prisma.progress.findFirst({
//             where: {
//               studentId: id,
//               sentTime: {
//                 gte: startDate,
//                 lte: endDate,
//               },
//             },
//             select: {
//               status: true,
//               sentTime: true,
//               replayedTime: true,
//             },
//           });

//           return {
//             id,
//             firstName,
//             fatherName,
//             lastName,
//             ...(temp ?? {
//               status: "not sent" as const,
//               sentTime: null,
//               replayedTime: null,
//             }),
//           };
//         })
//       );
//     });

//   return data;
// }

// export async function assignStudent({ teacherId, studentId }: AssignSchema) {
//   const group = await prisma.group.findFirst({
//     where: { groupTeacher: { some: { teacherId } } },
//   });

//   if (group) {
//     await prisma.groupStudent.updateMany({
//       where: { studentId },
//       data: { groupId: group.id },
//     });
//   }

//   return { status: true, message: "successfully assign student" };
// }

// export async function getStudentList() {
//   const data = await prisma.user.findMany({
//     where: { role: "recordStudent" },
//     select: { id: true, firstName: true, fatherName: true, lastName: true },
//   });

//   return data;
// }
