// import { NextRequest, NextResponse } from "next/server";
// import { readFile } from "fs/promises";
// import { getPaymentReceiptUrl } from "@/features/online/payment/server";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ userId: string; filename: string }> }
// ) {
//   try {
//     const { userId, filename } = await params;

//     // Validate the receipt access
//     const filePath = await getPaymentReceiptUrl(userId, filename);

//     // Read the file
//     const fileBuffer = await readFile(filePath);

//     // Determine content type based on file extension
//     const ext = filename.split(".").pop()?.toLowerCase();
//     let contentType = "image/jpeg";

//     switch (ext) {
//       case "png":
//         contentType = "image/png";
//         break;
//       case "jpg":
//       case "jpeg":
//         contentType = "image/jpeg";
//         break;
//       default:
//         contentType = "image/jpeg";
//     }

//     return new NextResponse(fileBuffer, {
//       headers: {
//         "Content-Type": contentType,
//         "Cache-Control": "public, max-age=31536000",
//       },
//     });
//   } catch (error) {
//     console.error("Error serving receipt:", error);
//     return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
//   }
// }
