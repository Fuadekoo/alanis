// "use server";

// import prisma from "@/lib/db";
// import { mkdir, writeFile } from "fs/promises";

// // Type definitions for payment data
// type PaymentData = {
//   year: number;
//   month: number;
// };

// type PaymentGroupWithPayments = {
//   id: string;
//   status: string;
//   img: string;
//   price: number;
//   createdAt: Date;
//   payments: PaymentData[];
// };

// export async function getPayment(id: string) {
//   if (!id) return [];

//   try {
//     // Get student information to verify access
//     const student = await prisma.user.findFirst({
//       where: { id, role: "student" },
//       select: { id: true },
//     });

//     if (!student) return [];

//     // Get all payment groups for this student
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const paymentGroups = (await (prisma.paymentGroup as any).findMany({
//       where: { userId: student.id },
//       select: {
//         id: true,
//         status: true,
//         img: true,
//         price: true,
//         createdAt: true,
//         payments: {
//           select: {
//             year: true,
//             month: true,
//           },
//           orderBy: [{ year: "asc" }, { month: "asc" }],
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     })) as PaymentGroupWithPayments[];

//     // Transform payment groups into the expected format
//     const result = paymentGroups.map((group: PaymentGroupWithPayments) => {
//       // Group payments by year
//       const paymentsByYear = new Map<number, number[]>();

//       group.payments.forEach((payment: PaymentData) => {
//         if (!paymentsByYear.has(payment.year)) {
//           paymentsByYear.set(payment.year, []);
//         }
//         paymentsByYear.get(payment.year)!.push(payment.month);
//       });

//       // Convert to the expected format
//       const list = Array.from(paymentsByYear.entries()).map(
//         ([year, months]) => ({
//           year,
//           months: months.sort((a, b) => a - b).join(","),
//         })
//       );

//       return {
//         list,
//         status: group.status,
//         id: group.id,
//         img: group.img,
//         price: group.price ? Number(group.price) : 0, // Convert Decimal to number
//         createdAt: group.createdAt,
//       };
//     });

//     return result;
//   } catch (error) {
//     console.error("Error fetching payment data:", error);
//     return [];
//   }
// }

// export async function registerPayment({
//   id: userId,
//   monthsByYear,
//   img,
//   ext,
//   price,
// }: {
//   id: string;
//   monthsByYear: Record<number, number[]>;
//   img: string;
//   ext: string;
//   price: number; // Now required
// }) {
//   try {
//     // Validate input parameters
//     if (
//       !userId ||
//       !img ||
//       !ext ||
//       !monthsByYear ||
//       typeof monthsByYear !== "object" ||
//       Object.keys(monthsByYear).length === 0 ||
//       price === undefined ||
//       price === null
//     ) {
//       return {
//         status: false,
//         message:
//           "Invalid input parameters. Please check all required fields including payment amount.",
//       };
//     }

//     // Validate years and months
//     const allMonths: { year: number; month: number }[] = [];
//     for (const [yearStr, months] of Object.entries(monthsByYear)) {
//       const year = parseInt(yearStr);

//       if (year < 2020 || year > 2050) {
//         return {
//           status: false,
//           message: "Invalid year. Please select a valid year.",
//         };
//       }

//       if (!Array.isArray(months) || months.length === 0) {
//         return {
//           status: false,
//           message: "Invalid month selection for year " + year,
//         };
//       }

//       const invalidMonths = months.filter((month) => month < 0 || month > 11);
//       if (invalidMonths.length > 0) {
//         return {
//           status: false,
//           message: "Invalid month selection. Please select valid months.",
//         };
//       }

//       // Add all year-month combinations to the list
//       months.forEach((month) => {
//         allMonths.push({ year, month });
//       });
//     }

//     if (allMonths.length === 0) {
//       return {
//         status: false,
//         message: "Please select at least one month.",
//       };
//     }

//     // Validate price (now required)
//     if (typeof price !== "number" || isNaN(price) || price <= 0) {
//       return {
//         status: false,
//         message:
//           "Payment amount is required and must be a valid amount greater than 0.",
//       };
//     }
//     if (price > 1000000) {
//       return {
//         status: false,
//         message: "Price cannot exceed 1,000,000 ETB.",
//       };
//     }

//     // Check if user exists and is a student
//     const user = await prisma.user.findFirst({
//       where: { id: userId, role: "student" },
//       select: {
//         id: true,
//         firstName: true,
//         fatherName: true,
//         lastName: true,
//         controller: { select: { chatId: true } },
//       },
//     });

//     if (!user) {
//       return {
//         status: false,
//         message: "Student not found or access denied.",
//       };
//     }

//     // Create upload directory
//     await mkdir(`./upload/payment/${userId}`, { recursive: true });

//     const fileName = `${new Date()
//       .toISOString()
//       .replace(/[-:\.]/g, "")}.${ext}`;

//     // Save the image file
//     try {
//       await writeFile(
//         `./upload/payment/${userId}/${fileName}`,
//         Buffer.from(img, "base64")
//       );
//     } catch (fileError) {
//       console.error("File upload error:", fileError);
//       return {
//         status: false,
//         message: "Failed to save payment receipt. Please try again.",
//       };
//     }

//     // Check for existing payments in the selected months to avoid duplicates
//     const existingPayments = await prisma.payment.findMany({
//       where: {
//         paymentGroup: {
//           userId,
//         },
//         OR: allMonths.map(({ year, month }) => ({ year, month })),
//       },
//       include: {
//         paymentGroup: {
//           select: { status: true },
//         },
//       },
//     });

//     // Filter out months that already have approved payments
//     const approvedPayments = existingPayments.filter(
//       (p) => p.paymentGroup.status === "approved"
//     );

//     const newMonths = allMonths.filter(
//       ({ year, month }) =>
//         !approvedPayments.some((p) => p.year === year && p.month === month)
//     );

//     if (newMonths.length === 0) {
//       return {
//         status: false,
//         message: "All selected months already have approved payments.",
//       };
//     }

//     if (approvedPayments.length > 0) {
//       const approvedMonthNames = approvedPayments
//         .map(
//           (p) =>
//             `${new Date(p.year, p.month, 1).toLocaleString("default", {
//               month: "long",
//             })} ${p.year}`
//         )
//         .join(", ");
//       console.warn(`Skipping already approved months: ${approvedMonthNames}`);
//     }

//     // Create a new payment group for this submission
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const paymentGroup = (await (prisma.paymentGroup as any).create({
//       data: {
//         userId,
//         status: "paid", // Default status when student submits
//         img: fileName,
//         price: price, // Use the required custom price
//       },
//     })) as { id: string };

//     // Create individual payment records for each month in this group
//     const paymentPromises = newMonths.map(({ year, month }) =>
//       prisma.payment.create({
//         data: {
//           paymentGroupId: paymentGroup.id,
//           year,
//           month,
//         },
//       })
//     );

//     try {
//       await Promise.all(paymentPromises);
//     } catch (paymentError) {
//       // If payment creation fails, delete the payment group
//       await prisma.paymentGroup.delete({
//         where: { id: paymentGroup.id },
//       });

//       console.error("Error creating payments:", paymentError);
//       return {
//         status: false,
//         message: "Failed to create payment records. Please try again.",
//       };
//     }

//     // Send notification to controller
//     if (user.controller?.chatId) {
//       try {
//         // Group months by year for notification
//         const monthsByYearForNotification = newMonths.reduce(
//           (acc, { year, month }) => {
//             if (!acc[year]) acc[year] = [];
//             acc[year].push(month);
//             return acc;
//           },
//           {} as Record<number, number[]>
//         );

//         const yearMonthStrings = Object.entries(monthsByYearForNotification)
//           .map(([year, months]) => {
//             const monthNames = months
//               .sort((a, b) => a - b)
//               .map((m) =>
//                 new Date(parseInt(year), m, 1).toLocaleString("default", {
//                   month: "short",
//                 })
//               )
//               .join(", ");
//             return `${monthNames} ${year}`;
//           })
//           .join("; ");

//         await global.bot.api.sendMessage(
//           user.controller.chatId,
//           `${user.firstName} ${user.fatherName} ${user.lastName} sent payment for ${yearMonthStrings} (${newMonths.length} month(s))`
//         );
//       } catch (notificationError) {
//         console.error("Notification error:", notificationError);
//         // Don't fail the entire operation for notification errors
//       }
//     }

//     return {
//       status: true,
//       message: `Payment registered successfully for ${newMonths.length} month(s)`,
//       paymentGroupId: paymentGroup.id,
//       processedMonths: newMonths,
//       skippedMonths: approvedPayments.map((p) => ({
//         year: p.year,
//         month: p.month,
//       })),
//     };
//   } catch (error) {
//     console.error("Payment registration error:", error);
//     return {
//       status: false,
//       message: "An unexpected error occurred. Please try again later.",
//     };
//   }
// }

// export async function approved(
//   paymentGroupId: string,
//   status: "approved" | "rejected" | "paid"
// ) {
//   try {
//     // Validate input
//     if (!paymentGroupId || !status) {
//       return {
//         status: false,
//         message: "Invalid payment group ID or status.",
//       };
//     }

//     if (!["approved", "rejected", "paid"].includes(status)) {
//       return {
//         status: false,
//         message: "Invalid status. Must be approved, rejected, or paid.",
//       };
//     }

//     // Check if payment group exists
//     const existingPaymentGroup = await prisma.paymentGroup.findUnique({
//       where: { id: paymentGroupId },
//       select: {
//         id: true,
//         status: true,
//         userId: true,
//         payments: {
//           select: {
//             year: true,
//             month: true,
//           },
//         },
//       },
//     });

//     if (!existingPaymentGroup) {
//       return {
//         status: false,
//         message: "Payment group not found.",
//       };
//     }

//     // Allow reversibility - remove the restriction on already approved payments
//     // This allows admins to change approved/rejected payments back to pending or to the opposite status

//     // Simulate processing delay
//     await new Promise((res) => setTimeout(res, 1000));

//     // Update payment group status
//     const updatedPaymentGroup = await prisma.paymentGroup.update({
//       where: { id: paymentGroupId },
//       data: { status },
//     });

//     // Get student information for notification
//     const student = await prisma.user.findFirst({
//       where: { id: existingPaymentGroup.userId },
//       select: {
//         firstName: true,
//         fatherName: true,
//         lastName: true,
//         controller: { select: { chatId: true } },
//       },
//     });

//     // Send notification to controller about status change
//     if (student?.controller?.chatId) {
//       try {
//         const monthNames = existingPaymentGroup.payments
//           .map((p) =>
//             new Date(p.year, p.month, 1).toLocaleString("default", {
//               month: "short",
//             })
//           )
//           .join(", ");

//         const statusMessage =
//           status === "approved"
//             ? "approved"
//             : status === "rejected"
//             ? "rejected"
//             : "pending";

//         await global.bot.api.sendMessage(
//           student.controller.chatId,
//           `Payment ${statusMessage} for ${student.firstName} ${student.fatherName} ${student.lastName} - ${monthNames} (${existingPaymentGroup.payments.length} month(s))`
//         );
//       } catch (notificationError) {
//         console.error("Notification error:", notificationError);
//         // Don't fail the operation for notification errors
//       }
//     }

//     return {
//       status: true,
//       message: `Payment group ${status} successfully.`,
//       paymentGroup: updatedPaymentGroup,
//     };
//   } catch (error) {
//     console.error("Payment approval error:", error);
//     return {
//       status: false,
//       message: "An error occurred while updating payment status.",
//     };
//   }
// }

// export async function getPaymentReceiptUrl(userId: string, filename: string) {
//   try {
//     // Verify the file belongs to the user through payment group
//     const paymentGroup = await prisma.paymentGroup.findFirst({
//       where: {
//         userId,
//         img: filename,
//       },
//       select: { id: true },
//     });

//     if (!paymentGroup) {
//       throw new Error("Payment receipt not found or access denied");
//     }

//     // Return the file path for serving
//     return `./upload/payment/${userId}/${filename}`;
//   } catch (error) {
//     console.error("Error getting payment receipt URL:", error);
//     throw error;
//   }
// }

// export async function deletePayment(paymentGroupId: string) {
//   try {
//     // Validate input
//     if (!paymentGroupId) {
//       return {
//         status: false,
//         message: "Invalid payment group ID.",
//       };
//     }

//     // Check if payment group exists and get its details
//     const existingPaymentGroup = await prisma.paymentGroup.findUnique({
//       where: { id: paymentGroupId },
//       select: {
//         id: true,
//         status: true,
//         userId: true,
//         img: true,
//         payments: {
//           select: {
//             year: true,
//             month: true,
//           },
//         },
//       },
//     });

//     if (!existingPaymentGroup) {
//       return {
//         status: false,
//         message: "Payment group not found.",
//       };
//     }

//     // Only allow deletion of pending payments
//     if (existingPaymentGroup.status !== "paid") {
//       return {
//         status: false,
//         message:
//           "Only pending payments can be deleted. This payment has already been processed.",
//       };
//     }

//     // Get student information for notification
//     const student = await prisma.user.findFirst({
//       where: { id: existingPaymentGroup.userId },
//       select: {
//         firstName: true,
//         fatherName: true,
//         lastName: true,
//         controller: { select: { chatId: true } },
//       },
//     });

//     // Delete the payment group (this will cascade to delete individual payments)
//     await prisma.paymentGroup.delete({
//       where: { id: paymentGroupId },
//     });

//     // Optional: Try to delete the receipt image file
//     try {
//       const { unlink } = await import("fs/promises");
//       await unlink(
//         `./upload/payment/${existingPaymentGroup.userId}/${existingPaymentGroup.img}`
//       );
//     } catch (fileError) {
//       // Don't fail the deletion if file removal fails
//       console.warn("Could not delete receipt file:", fileError);
//     }

//     // Send notification to controller about deletion
//     if (student?.controller?.chatId) {
//       try {
//         const monthNames = existingPaymentGroup.payments
//           .map((p) =>
//             new Date(p.year, p.month, 1).toLocaleString("default", {
//               month: "short",
//             })
//           )
//           .join(", ");

//         await global.bot.api.sendMessage(
//           student.controller.chatId,
//           `Payment deleted for ${student.firstName} ${student.fatherName} ${student.lastName} - ${monthNames} (${existingPaymentGroup.payments.length} month(s))`
//         );
//       } catch (notificationError) {
//         console.error("Notification error:", notificationError);
//         // Don't fail the operation for notification errors
//       }
//     }

//     return {
//       status: true,
//       message: "Payment deleted successfully.",
//     };
//   } catch (error) {
//     console.error("Payment deletion error:", error);
//     return {
//       status: false,
//       message: "An error occurred while deleting the payment.",
//     };
//   }
// }

// export async function getReceiptData(paymentGroupId: string) {
//   try {
//     const paymentGroup = await prisma.paymentGroup.findUnique({
//       where: { id: paymentGroupId },
//       select: {
//         id: true,
//         img: true,
//         userId: true,
//         user: {
//           select: {
//             firstName: true,
//             fatherName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     if (!paymentGroup) {
//       throw new Error("Payment group not found");
//     }

//     return {
//       receiptUrl: `/api/receipt/${paymentGroup.userId}/${paymentGroup.img}`,
//       studentName: `${paymentGroup.user.firstName} ${paymentGroup.user.fatherName} ${paymentGroup.user.lastName}`,
//     };
//   } catch (error) {
//     console.error("Error getting receipt data:", error);
//     throw error;
//   }
// }
