// "use client";

// import { registerPayment, getPayment } from "./server";
// import useMutation from "@/hooks/useMutation";
// import useData from "@/hooks/useData";
// import { useCallback, useState } from "react";
// import {
//   Button,
//   Input,
//   ModalBody,
//   ModalContent,
//   ModalFooter,
//   ModalHeader,
//   Card,
//   CardBody,
//   Divider,
//   Chip,
// } from "@heroui/react";
// import Image from "next/image";
// import { CModal } from "../../../components/ui/heroui";
// import { useParams } from "next/navigation";
// import {
//   Upload,
//   FileText,
//   Calendar,
//   DollarSign,
//   AlertCircle,
//   CheckCircle2,
// } from "lucide-react";

// const imgType = ["image/jpeg", "image/jpg", "image/png"];
// const today = new Date();
// const currentYear = today.getFullYear();
// const currentMonth = today.getMonth();

// const months = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// // Function to get years with unpaid months
// const getYearsWithUnpaidMonths = (
//   paidMonths: { list: { year: number; months: string }[] }[],
//   currentYear: number,
//   currentMonth: number
// ) => {
//   const yearsToCheck = Array.from({ length: 10 }, (_, i) => currentYear + i);
//   const yearsWithUnpaid = [];

//   for (const year of yearsToCheck) {
//     let hasUnpaidMonths = false;

//     for (let month = 0; month < 12; month++) {
//       // Skip past months for current year
//       if (year === currentYear && month < currentMonth) continue;

//       // Check if this month is not paid
//       const isMonthPaid = paidMonths?.some((paymentGroup) => {
//         return paymentGroup.list.some((yearData) => {
//           if (yearData.year !== year) return false;
//           const monthsList = yearData.months.split(",").map(Number);
//           return monthsList.includes(month);
//         });
//       });

//       if (!isMonthPaid) {
//         hasUnpaidMonths = true;
//         break;
//       }
//     }

//     if (hasUnpaidMonths) {
//       yearsWithUnpaid.push(year);
//       // Only return first 2 years with unpaid months
//       if (yearsWithUnpaid.length >= 2) break;
//     }
//   }

//   return yearsWithUnpaid;
// };

// export function Pay({
//   id,
//   onClose,
//   refresh,
// }: {
//   id: string;
//   onClose: () => void;
//   refresh: () => void;
// }) {
//   const { lang } = useParams<{ lang: string }>();
//   const [data, setData] = useState({ img: "", ext: "", price: "" });
//   const [selectedMonths, setSelectedMonths] = useState<
//     { year: number; month: number }[]
//   >([]);
//   const [errors, setErrors] = useState<{
//     file?: string;
//     months?: string;
//     amount?: string;
//     price?: string;
//   }>({});
//   const [dragActive, setDragActive] = useState(false);

//   // Fetch existing payments to determine which months are already paid
//   const [paidMonths] = useData(getPayment, () => {}, id);

//   // Get years with unpaid months (limit to 2 years)
//   const yearsWithUnpaid = getYearsWithUnpaidMonths(
//     paidMonths || [],
//     currentYear,
//     currentMonth
//   );

//   // Helper function to check if a month is already paid
//   const isMonthPaid = useCallback(
//     (year: number, month: number) => {
//       try {
//         if (!paidMonths || !Array.isArray(paidMonths)) return false;

//         return paidMonths.some((paymentGroup) => {
//           try {
//             if (!paymentGroup?.list || !Array.isArray(paymentGroup.list))
//               return false;
//             return paymentGroup.list.some((yearData) => {
//               if (!yearData || yearData.year !== year) return false;
//               if (!yearData.months || typeof yearData.months !== "string")
//                 return false;
//               const monthsList = yearData.months.split(",").map(Number);
//               return monthsList.includes(month);
//             });
//           } catch (error) {
//             console.error("Error in payment group check:", error);
//             return false;
//           }
//         });
//       } catch (error) {
//         console.error("Error in isMonthPaid:", error);
//         return false;
//       }
//     },
//     [paidMonths]
//   );

//   const [action, isLoading] = useMutation(
//     registerPayment,
//     (response: unknown) => {
//       const result = response as { status?: boolean; message?: string };
//       if (result?.status) {
//         setData({ img: "", ext: "", price: "" });
//         setSelectedMonths([]);
//         setErrors({});

//         // Show success message
//         console.log("Payment submitted successfully:", result.message);

//         onClose();
//         refresh();
//       } else {
//         // Handle server errors
//         const message =
//           result?.message || "An error occurred. Please try again.";
//         setErrors({
//           file: message.includes("receipt") ? message : undefined,
//           months: message.includes("month") ? message : undefined,
//           amount: message.includes("amount") ? message : undefined,
//           price: message.includes("price") ? message : undefined,
//         });

//         // If error doesn't fit any category, show it as a general file error
//         if (
//           !message.includes("receipt") &&
//           !message.includes("month") &&
//           !message.includes("amount") &&
//           !message.includes("price")
//         ) {
//           setErrors({ file: message });
//         }
//       }
//     }
//   );

//   const handleFile = useCallback(async (file: File | undefined) => {
//     setErrors((prev) => ({ ...prev, file: undefined }));

//     if (!file) {
//       setData({ img: "", ext: "", price: "" });
//       return;
//     }

//     if (!imgType.includes(file.type)) {
//       setErrors((prev) => ({
//         ...prev,
//         file: "Please upload a valid image file (JPEG, JPG, or PNG)",
//       }));
//       setData({ img: "", ext: "", price: "" });
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       // 5MB limit
//       setErrors((prev) => ({
//         ...prev,
//         file: "File size must be less than 5MB",
//       }));
//       setData({ img: "", ext: "", price: "" });
//       return;
//     }

//     try {
//       const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
//       setData({
//         img: base64,
//         ext: file.name.split(".").at(-1) ?? "",
//         price: data.price, // Preserve existing price
//       });
//     } catch {
//       setErrors((prev) => ({
//         ...prev,
//         file: "Failed to process the file. Please try again.",
//       }));
//       setData({ img: "", ext: "", price: "" });
//     }
//   }, []);

//   const toggleMonth = useCallback(
//     (year: number, month: number) => {
//       try {
//         // Don't allow selection of already paid months
//         if (isMonthPaid(year, month)) {
//           return;
//         }

//         setErrors((prev) => ({ ...prev, months: undefined }));
//         setSelectedMonths((prev) => {
//           const existing = prev.find(
//             (item) => item.year === year && item.month === month
//           );
//           if (existing) {
//             return prev.filter(
//               (item) => !(item.year === year && item.month === month)
//             );
//           } else {
//             return [...prev, { year, month }].sort((a, b) => {
//               if (a.year !== b.year) return a.year - b.year;
//               return a.month - b.month;
//             });
//           }
//         });
//       } catch (error) {
//         console.error("Error in toggleMonth:", error);
//         setErrors((prev) => ({
//           ...prev,
//           months:
//             "An error occurred while selecting the month. Please try again.",
//         }));
//       }
//     },
//     [isMonthPaid]
//   );

//   const calculateTotal = useCallback(() => {
//     // Price is now required, so use the entered price
//     if (data.price && parseFloat(data.price) > 0) {
//       return parseFloat(data.price);
//     }
//     // Return 0 if no valid price is entered (validation will catch this)
//     return 0;
//   }, [data.price]);

//   const handlePriceChange = useCallback((value: string) => {
//     setErrors((prev) => ({ ...prev, price: undefined }));
//     // Only allow numbers and decimal point
//     const numericValue = value.replace(/[^0-9.]/g, "");
//     // Prevent multiple decimal points
//     const parts = numericValue.split(".");
//     const cleanValue =
//       parts.length > 2
//         ? parts[0] + "." + parts.slice(1).join("")
//         : numericValue;

//     setData((prev) => ({ ...prev, price: cleanValue }));
//   }, []);

//   const validateForm = useCallback(() => {
//     const newErrors: typeof errors = {};

//     if (!data.img) {
//       newErrors.file = "Payment receipt is required";
//     }

//     if (selectedMonths.length === 0) {
//       newErrors.months = "Please select at least one month";
//     }

//     // Price is now required
//     if (!data.price || data.price.trim() === "") {
//       newErrors.price = "Payment amount is required";
//     } else {
//       const priceValue = parseFloat(data.price);
//       if (isNaN(priceValue) || priceValue <= 0) {
//         newErrors.price = "Please enter a valid price greater than 0";
//       } else if (priceValue > 1000000) {
//         newErrors.price = "Price cannot exceed 1,000,000 ETB";
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   }, [data.img, data.price, selectedMonths]);

//   const handleSubmit = useCallback(() => {
//     if (!validateForm()) return;

//     // Clear any existing errors
//     setErrors({});

//     // Group selected months by year for submission
//     const monthsByYear = selectedMonths.reduce((acc, { year, month }) => {
//       if (!acc[year]) acc[year] = [];
//       acc[year].push(month);
//       return acc;
//     }, {} as Record<number, number[]>);

//     action({
//       id,
//       monthsByYear, // Send grouped months by year
//       price: parseFloat(data.price),
//       img: data.img,
//       ext: data.ext,
//     });
//   }, [validateForm, action, id, selectedMonths, data]);

//   const handleDragEnter = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(true);
//   }, []);

//   const handleDragLeave = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
//   }, []);

//   const handleDragOver = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//   }, []);

//   const handleDrop = useCallback(
//     (e: React.DragEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       setDragActive(false);

//       const files = e.dataTransfer.files;
//       if (files && files[0]) {
//         handleFile(files[0]);
//       }
//     },
//     [handleFile]
//   );

//   return (
//     <CModal
//       isOpen={true}
//       onOpenChange={() => {
//         setData({ img: "", ext: "", price: "" });
//         setSelectedMonths([]);
//         setErrors({});
//         onClose();
//       }}
//       size="4xl"
//       scrollBehavior="outside"
//     >
//       <ModalContent>
//         {(onClose) => (
//           <>
//             <ModalHeader className="flex flex-col gap-1">
//               <div className="flex items-center gap-2">
//                 <DollarSign className="size-5 text-primary" />
//                 <span className="text-xl font-semibold">
//                   {lang == "am" ? "የክፍያ ምዝገባ" : "Payment Registration"}
//                 </span>
//               </div>
//               <p className="text-sm text-default-500 font-normal">
//                 {lang == "am"
//                   ? "የክፍያ ደረሰኝዎን ይሰቅሉ እና ወራቶችን ይምረጡ"
//                   : "Upload your payment receipt and select payment months"}
//               </p>
//             </ModalHeader>
//             <ModalBody className="gap-6">
//               {/* File Upload Section */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2">
//                   <FileText className="size-4 text-default-600" />
//                   <label className="text-sm font-medium text-default-700">
//                     {lang == "am" ? "የክፍያ ደረሰኝ" : "Payment Receipt"}
//                   </label>
//                   <span className="text-danger text-sm">*</span>
//                 </div>

//                 <label
//                   htmlFor="file"
//                   onDragEnter={handleDragEnter}
//                   onDragLeave={handleDragLeave}
//                   onDragOver={handleDragOver}
//                   onDrop={handleDrop}
//                   className={`
//                     relative block w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
//                     ${
//                       dragActive
//                         ? "border-primary bg-primary/5 scale-[1.02]"
//                         : data.img
//                         ? "border-success bg-success/5"
//                         : errors.file
//                         ? "border-danger bg-danger/5"
//                         : "border-default-300 bg-default-50/50 hover:border-primary hover:bg-primary/5"
//                     }
//                   `}
//                 >
//                   <Input
//                     id="file"
//                     type="file"
//                     className="hidden"
//                     accept={imgType.join(", ")}
//                     onChange={(e) => handleFile(e.target.files?.[0])}
//                   />

//                   {data.img ? (
//                     <div className="space-y-4">
//                       <Image
//                         alt="Payment Receipt"
//                         src={`data:image/png;base64,${data.img}`}
//                         width={300}
//                         height={200}
//                         className="mx-auto max-h-48 w-auto rounded-lg shadow-md object-contain"
//                       />
//                       <div className="flex items-center justify-center gap-2 text-success">
//                         <CheckCircle2 className="size-4" />
//                         <span className="text-sm font-medium">
//                           {lang == "am"
//                             ? "ፋይል ተመርጧል"
//                             : "File selected successfully"}
//                         </span>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-center space-y-3">
//                       <div className="mx-auto flex items-center justify-center w-16 h-16 bg-default-100 rounded-full">
//                         <Upload className="size-8 text-default-400" />
//                       </div>
//                       <div className="space-y-1">
//                         <p className="text-sm font-medium text-default-700">
//                           {lang == "am"
//                             ? "ፋይል ለመምረጥ ይጫኑ ወይም ይጎትቱ"
//                             : "Click to upload or drag and drop"}
//                         </p>
//                         <p className="text-xs text-default-500">
//                           PNG, JPG, JPEG up to 5MB
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </label>

//                 {errors.file && (
//                   <div className="flex items-center gap-2 text-danger text-sm">
//                     <AlertCircle className="size-4" />
//                     <span>{errors.file}</span>
//                   </div>
//                 )}
//               </div>

//               <Divider />

//               {/* Price Input Section */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2">
//                   <DollarSign className="size-4 text-default-600" />
//                   <label className="text-sm font-medium text-default-700">
//                     {lang == "am" ? "የክፍያ መጠን" : "Payment Amount"}
//                   </label>
//                   <span className="text-danger text-sm">*</span>
//                 </div>

//                 <div className="relative">
//                   <Input
//                     type="text"
//                     value={data.price}
//                     onChange={(e) => handlePriceChange(e.target.value)}
//                     placeholder={
//                       lang == "am" ? "ክፍያ መጠን (ETB)" : "Payment amount (ETB)"
//                     }
//                     startContent={
//                       <div className="pointer-events-none flex items-center">
//                         <span className="text-default-400 text-small">ETB</span>
//                       </div>
//                     }
//                     className="max-w-xs"
//                     color={errors.price ? "danger" : "default"}
//                     errorMessage={errors.price}
//                     isRequired
//                   />
//                 </div>

//                 {errors.price && (
//                   <div className="flex items-center gap-2 text-danger text-sm">
//                     <AlertCircle className="size-4" />
//                     <span>{errors.price}</span>
//                   </div>
//                 )}
//               </div>

//               <Divider />

//               {/* Multi-Year Month Selection */}
//               <div className="space-y-3">
//                 <div className="flex items-center gap-2">
//                   <Calendar className="size-4 text-default-600" />
//                   <label className="text-sm font-medium text-default-700">
//                     {lang == "am" ? "ወራቶች" : "Payment Months"}
//                   </label>
//                   <span className="text-danger text-sm">*</span>
//                 </div>

//                 {/* Legend for month status */}
//                 <div className="flex flex-wrap gap-4 text-xs text-default-500">
//                   <div className="flex items-center gap-1">
//                     <div className="w-3 h-3 border border-default-300 rounded"></div>
//                     <span>{lang == "am" ? "ተገኝ" : "Available"}</span>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <div className="w-3 h-3 bg-success rounded flex items-center justify-center">
//                       <CheckCircle2 className="size-2 text-white" />
//                     </div>
//                     <span>{lang == "am" ? "ተከፍሏል" : "Already Paid"}</span>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <div className="w-3 h-3 bg-default-300 rounded opacity-50"></div>
//                     <span>{lang == "am" ? "አይገኝም" : "Unavailable"}</span>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {yearsWithUnpaid && yearsWithUnpaid.length > 0 ? (
//                     yearsWithUnpaid.map((year) => {
//                       const yearMonths = selectedMonths.filter(
//                         (item) => item.year === year
//                       );
//                       const hasSelectedMonths = yearMonths.length > 0;

//                       // Count paid months for this year
//                       const paidMonthsCount = months.filter((_, index) =>
//                         isMonthPaid(year, index)
//                       ).length;

//                       return (
//                         <Card
//                           key={year}
//                           className={`p-4 transition-all ${
//                             hasSelectedMonths
//                               ? "border-primary/30 bg-primary/5"
//                               : "border-default-200"
//                           }`}
//                         >
//                           <CardBody className="gap-4">
//                             <div className="flex items-center justify-between">
//                               <h3 className="text-lg font-semibold text-default-700">
//                                 {year}
//                               </h3>
//                               <div className="flex items-center gap-2">
//                                 {paidMonthsCount > 0 && (
//                                   <Chip
//                                     variant="flat"
//                                     color="success"
//                                     size="sm"
//                                     startContent={
//                                       <CheckCircle2 className="size-3" />
//                                     }
//                                   >
//                                     {paidMonthsCount} paid
//                                   </Chip>
//                                 )}
//                                 {hasSelectedMonths && (
//                                   <Chip
//                                     variant="flat"
//                                     color="primary"
//                                     size="sm"
//                                   >
//                                     {yearMonths.length} selected
//                                   </Chip>
//                                 )}
//                               </div>
//                             </div>

//                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
//                               {months.map((month, index) => {
//                                 try {
//                                   const isPastMonth =
//                                     year === currentYear &&
//                                     index < currentMonth;
//                                   const isAlreadyPaid = isMonthPaid(
//                                     year,
//                                     index
//                                   );
//                                   const isDisabled =
//                                     isPastMonth || isAlreadyPaid;
//                                   const isSelected = selectedMonths.some(
//                                     (item) =>
//                                       item.year === year && item.month === index
//                                   );

//                                   return (
//                                     <Button
//                                       key={index}
//                                       variant={
//                                         isSelected ? "solid" : "bordered"
//                                       }
//                                       color={
//                                         isAlreadyPaid
//                                           ? "success"
//                                           : isSelected
//                                           ? "primary"
//                                           : "default"
//                                       }
//                                       size="sm"
//                                       isDisabled={isDisabled}
//                                       onPress={() => {
//                                         try {
//                                           if (!isDisabled) {
//                                             toggleMonth(year, index);
//                                           }
//                                         } catch (error) {
//                                           console.error(
//                                             "Error selecting month:",
//                                             error
//                                           );
//                                         }
//                                       }}
//                                       className={`
//                                       ${
//                                         isSelected
//                                           ? "ring-2 ring-primary/30"
//                                           : ""
//                                       }
//                                       ${isDisabled ? "opacity-50" : ""}
//                                       ${
//                                         isAlreadyPaid
//                                           ? "cursor-not-allowed"
//                                           : ""
//                                       }
//                                     `}
//                                     >
//                                       <span className="flex items-center gap-1">
//                                         {month.slice(0, 3)}
//                                         {isAlreadyPaid && (
//                                           <CheckCircle2 className="size-3" />
//                                         )}
//                                       </span>
//                                     </Button>
//                                   );
//                                 } catch (error) {
//                                   console.error(
//                                     `Error rendering month ${month}:`,
//                                     error
//                                   );
//                                   return (
//                                     <Button
//                                       key={index}
//                                       variant="bordered"
//                                       color="default"
//                                       size="sm"
//                                       isDisabled
//                                       className="opacity-50"
//                                     >
//                                       {month.slice(0, 3)}
//                                     </Button>
//                                   );
//                                 }
//                               })}
//                             </div>

//                             {hasSelectedMonths && (
//                               <div className="pt-3 border-t border-default-200/50">
//                                 <div className="flex items-center justify-between text-sm">
//                                   <span className="text-default-600">
//                                     {year}: {yearMonths.length} month
//                                     {yearMonths.length !== 1 ? "s" : ""}
//                                   </span>
//                                   <span className="font-semibold text-primary">
//                                     {data.price && parseFloat(data.price) > 0
//                                       ? `${(
//                                           (parseFloat(data.price) /
//                                             selectedMonths.length) *
//                                           yearMonths.length
//                                         ).toLocaleString()} ETB`
//                                       : "Amount not set"}
//                                   </span>
//                                 </div>
//                               </div>
//                             )}
//                           </CardBody>
//                         </Card>
//                       );
//                     })
//                   ) : (
//                     <div className="text-center py-8">
//                       <p className="text-default-500">
//                         {lang == "am"
//                           ? "ሊከፈሉ የሚችሉ ወራቶች አልተገኙም"
//                           : "No available months found for payment"}
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 {selectedMonths.length > 0 && (
//                   <Card className="p-4 border border-primary/20 bg-primary/5">
//                     <CardBody className="gap-2">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <span className="text-sm font-medium text-default-700">
//                             {lang == "am" ? "የተመረጡ ወራቶች:" : "Total Selected:"}{" "}
//                             {selectedMonths.length} month
//                             {selectedMonths.length !== 1 ? "s" : ""}
//                           </span>
//                           <div className="text-xs text-default-500 mt-1">
//                             {Object.entries(
//                               selectedMonths.reduce((acc, { year, month }) => {
//                                 if (!acc[year]) acc[year] = [];
//                                 acc[year].push(months[month].slice(0, 3));
//                                 return acc;
//                               }, {} as Record<number, string[]>)
//                             ).map(([year, monthList]) => (
//                               <span key={year} className="mr-3">
//                                 {year}: {monthList.join(", ")}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-lg font-bold text-primary">
//                             {calculateTotal().toLocaleString()} ETB
//                           </div>
//                           <div className="text-xs text-default-500">
//                             {lang == "am" ? "ብዥ ጠን" : "Custom amount"}
//                           </div>
//                         </div>
//                       </div>
//                     </CardBody>
//                   </Card>
//                 )}

//                 {errors.months && (
//                   <div className="flex items-center gap-2 text-danger text-sm">
//                     <AlertCircle className="size-4" />
//                     <span>{errors.months}</span>
//                   </div>
//                 )}
//               </div>

//               {/* General Error Display */}
//               {Object.values(errors).filter((v) => !!v).length > 0 && (
//                 <Card className="border border-danger/20 bg-danger/5">
//                   <CardBody className="gap-2">
//                     <div className="flex items-center gap-2 text-danger">
//                       <AlertCircle className="size-4" />
//                       <span className="text-sm font-medium">
//                         {lang == "am"
//                           ? "ችግር ተፈጥሯል"
//                           : "Please fix the following issues"}
//                       </span>
//                     </div>
//                     <ul className="text-xs text-danger-600 ml-6 space-y-1">
//                       {errors.file && <li>{errors.file}</li>}
//                       {errors.months && <li>{errors.months}</li>}
//                       {errors.amount && <li>{errors.amount}</li>}
//                       {errors.price && <li>{errors.price}</li>}
//                     </ul>
//                   </CardBody>
//                 </Card>
//               )}

//               {/* Summary */}
//               {selectedMonths.length > 0 && data.img && (
//                 <Card className="border border-success/20 bg-success/5">
//                   <CardBody className="gap-2">
//                     <div className="flex items-center gap-2 text-success">
//                       <CheckCircle2 className="size-4" />
//                       <span className="text-sm font-medium">
//                         {lang == "am" ? "ዝግጁ ለማስገባት" : "Ready to submit"}
//                       </span>
//                     </div>
//                     <div className="text-xs text-default-600">
//                       {lang == "am"
//                         ? `${
//                             selectedMonths.length
//                           } ወራቶች - ${calculateTotal().toLocaleString()} ETB`
//                         : `${
//                             selectedMonths.length
//                           } months - ${calculateTotal().toLocaleString()} ETB`}
//                     </div>
//                   </CardBody>
//                 </Card>
//               )}
//             </ModalBody>

//             <ModalFooter className="gap-3">
//               <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
//                 {lang == "am" ? "ይሰረዝ" : "Cancel"}
//               </Button>
//               <Button
//                 color="primary"
//                 onPress={handleSubmit}
//                 isLoading={isLoading}
//                 isDisabled={
//                   !data.img ||
//                   selectedMonths.length === 0 ||
//                   !data.price ||
//                   data.price.trim() === ""
//                 }
//                 className="font-medium"
//               >
//                 {isLoading
//                   ? lang == "am"
//                     ? "እየተላከ..."
//                     : "Submitting..."
//                   : lang == "am"
//                   ? "ይላክ"
//                   : "Submit Payment"}
//               </Button>
//             </ModalFooter>
//           </>
//         )}
//       </ModalContent>
//     </CModal>
//   );
// }
