// "use server";

// import prisma from "@/lib/db";

// export async function deleteGroup(id: string) {
//   await prisma.group.delete({ where: { id } });
//   return { status: true, message: "successfully deleted" };
// }

// export async function getGroups() {
//   const data = await prisma.group
//     .findMany({
//       select: {
//         id: true,
//         name: true,
//         username: true,
//         groupTeacher: {
//           select: {
//             teacher: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 fatherName: true,
//                 lastName: true,
//               },
//             },
//           },
//         },
//         _count: { select: { groupStudent: true } },
//       },
//     })
//     .then((res) =>
//       res.map(
//         ({
//           id,
//           name,
//           username,
//           groupTeacher: [groupTeacher],
//           _count: { groupStudent },
//         }) => ({
//           id,
//           name,
//           username,
//           teacher: groupTeacher?.teacher as
//             | (typeof groupTeacher)["teacher"]
//             | undefined,
//           student: groupStudent,
//         })
//       )
//     );

//   return data;
// }
