// import { readFile } from "fs/promises";

// export async function GET(
//   req: Request,
//   { params }: { params: Promise<{ fileName?: string[] }> }
// ) {
//   const [id, fileName] = (await params).fileName ?? ["", ""];
//   if (id && fileName) {
//     console.log(fileName);
//     return new Response(
//       Buffer.from(
//         (await readFile(`./upload/payment/${id}/${fileName}`)).toString(
//           "base64"
//         ),
//         "base64"
//       ),
//       {
//         status: 200,
//         headers: { "Content-Type": "image/jpeg" },
//       }
//     );
//   } else {
//     return Response.json({ message: "file not found" }, { status: 404 });
//   }
// }
