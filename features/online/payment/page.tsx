// "use client";

// // Type definitions for payment data
// type PaymentYearData = {
//   year: number;
//   months: string;
// };

// type PaymentGroupData = {
//   list: PaymentYearData[];
//   status: string;
//   id: string;
//   createdAt: Date;
//   price?: number;
// };

// import { getStudents } from "@/actions/controller/student";
// import {
//   Button,
//   Input,
//   Pagination,
//   ScrollShadow,
//   Select,
//   SelectItem,
//   Skeleton,
// } from "@/components/ui/heroui";
// import useData from "@/hooks/useData";
// import { Chip, cn } from "@heroui/react";
// import {
//   ArrowDownAZ,
//   ArrowUpZA,
//   CheckCircle,
//   ChevronLeft,
//   CircleX,
//   DollarSign,
//   Loader,
//   Search,
//   Clock,
//   Shield,
//   X,
//   Eye,
//   RotateCcw,
//   FileImage,
//   Download,
//   Trash2,
//   AlertTriangle,
// } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import React, { useState } from "react";
// import { getPayment, approved, getReceiptData, deletePayment } from "./server";
// import { Pay } from "./pay";
// import { Filter } from "@/lib/definitions";
// import { useSession } from "next-auth/react";
// import useMutation from "@/hooks/useMutation";
// import {
//   Modal,
//   ModalContent,
//   ModalHeader,
//   ModalBody,
//   ModalFooter,
//   useDisclosure,
// } from "@heroui/react";

// function SearchInput({
//   total,
//   search,
//   setSearch,
// }: {
//   total: number;
//   search: string;
//   setSearch: (search: string) => void;
// }) {
//   return (
//     <div className="border border-default-50/50 rounded-xl p-1 grid gap-2 grid-cols-[auto_1fr] ">
//       <div className="aspect-square bg-default-50/50 rounded-xl text-center content-center ">
//         {total}
//       </div>
//       <Input
//         value={search}
//         onValueChange={setSearch}
//         startContent={<Search className="size-4 " />}
//         classNames={{ inputWrapper: "rounded-full" }}
//       />
//     </div>
//   );
// }

// function PaginationComponent({
//   sort,
//   setSort,
//   total,
//   page,
//   setPage,
//   row,
//   setRow,
// }: {
//   sort: boolean;
//   setSort: () => void;
//   total: number;
//   page: number;
//   setPage: (page: number) => void;
//   row: Set<string>;
//   setRow: (row: number) => void;
// }) {
//   return (
//     <div className="border border-default-50/50 rounded-xl p-1 grid gap-2 grid-cols-[auto_1fr_auto]">
//       <Button
//         isIconOnly
//         variant="flat"
//         className="bg-default-50/50"
//         onPress={setSort}
//       >
//         {sort ? (
//           <ArrowUpZA className="size-4 " />
//         ) : (
//           <ArrowDownAZ className="size-4 " />
//         )}
//       </Button>
//       <Pagination
//         className="mx-auto"
//         classNames={{ wrapper: "" }}
//         showControls
//         isCompact
//         total={total}
//         page={page}
//         onChange={setPage}
//       />
//       <Select
//         className=""
//         classNames={{ innerWrapper: "w-20" }}
//         selectionMode="single"
//         selectedKeys={row}
//         onSelectionChange={(row) => setRow(+(Array.from(row)[0] ?? 0))}
//       >
//         {["50", "100", "150", "250"].map((v) => (
//           <SelectItem key={v}>{v}</SelectItem>
//         ))}
//       </Select>
//     </div>
//   );
// }

// // Delete Confirmation Modal Component
// function DeleteConfirmationModal({
//   isOpen,
//   onOpenChange,
//   paymentGroup,
//   onConfirm,
//   isDeleting,
// }: {
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   paymentGroup: PaymentGroupData | null;
//   onConfirm: () => void;
//   isDeleting: boolean;
// }) {
//   if (!paymentGroup) return null;

//   const totalMonths = paymentGroup.list.reduce(
//     (sum: number, yearData: PaymentYearData) =>
//       sum + yearData.months.split(",").length,
//     0
//   );

//   return (
//     <Modal
//       isOpen={isOpen}
//       onOpenChange={onOpenChange}
//       size="md"
//       classNames={{
//         base: "bg-gradient-to-br from-white to-default-50/80 backdrop-blur-md border border-danger/20 mx-2 sm:mx-0",
//         header:
//           "border-b border-danger/20 bg-gradient-to-r from-danger/5 to-danger/10 p-4 sm:p-6",
//         body: "p-4 sm:p-6",
//         footer: "border-t border-danger/20 p-4 sm:p-6",
//       }}
//     >
//       <ModalContent>
//         {(onClose) => (
//           <>
//             <ModalHeader className="flex flex-col gap-1">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-danger/10 rounded-lg flex-shrink-0">
//                   <AlertTriangle className="size-4 sm:size-5 text-danger" />
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <h3 className="text-lg sm:text-xl font-bold text-danger-800 truncate">
//                     Delete Payment
//                   </h3>
//                   <p className="text-xs sm:text-sm text-danger-600 font-normal">
//                     This action cannot be undone
//                   </p>
//                 </div>
//               </div>
//             </ModalHeader>
//             <ModalBody>
//               <div className="space-y-4">
//                 <div className="p-3 sm:p-4 bg-danger/5 rounded-xl border border-danger/20">
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className="w-2 h-2 bg-danger rounded-full flex-shrink-0"></div>
//                     <span className="font-semibold text-danger-800 text-sm sm:text-base">
//                       Payment Details
//                     </span>
//                   </div>
//                   <div className="space-y-1 text-xs sm:text-sm">
//                     <p className="text-default-700 flex flex-col sm:flex-row sm:items-center gap-1">
//                       <span className="font-medium">Amount:</span>
//                       <span className="font-bold text-danger">
//                         {(paymentGroup.price || 0).toLocaleString()} ETB
//                       </span>
//                     </p>
//                     <p className="text-default-700 flex flex-col sm:flex-row sm:items-center gap-1">
//                       <span className="font-medium">Months:</span>
//                       <span className="font-bold text-danger">
//                         {totalMonths} month{totalMonths !== 1 ? "s" : ""}
//                       </span>
//                     </p>
//                     <p className="text-default-700 flex flex-col sm:flex-row sm:items-center gap-1">
//                       <span className="font-medium">Status:</span>
//                       <span className="font-bold text-warning">
//                         Pending Review
//                       </span>
//                     </p>
//                   </div>
//                 </div>

//                 <div className="text-center space-y-2">
//                   <p className="text-default-800 font-medium text-sm sm:text-base">
//                     Are you sure you want to delete this payment?
//                   </p>
//                   <p className="text-xs sm:text-sm text-default-600">
//                     This will permanently remove the payment record and its
//                     receipt.
//                   </p>
//                 </div>
//               </div>
//             </ModalBody>
//             <ModalFooter>
//               <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
//                 <Button
//                   color="default"
//                   variant="light"
//                   onPress={onClose}
//                   className="order-2 sm:order-1 min-h-[44px] sm:min-h-[36px]"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   color="danger"
//                   onPress={() => {
//                     onConfirm();
//                     onClose();
//                   }}
//                   isLoading={isDeleting}
//                   isDisabled={isDeleting}
//                   startContent={
//                     !isDeleting ? <Trash2 className="size-4" /> : undefined
//                   }
//                   className="font-medium order-1 sm:order-2 min-h-[44px] sm:min-h-[36px]"
//                 >
//                   {isDeleting ? (
//                     <>
//                       <Loader className="size-4 animate-spin" />
//                       <span>Deleting...</span>
//                     </>
//                   ) : (
//                     "Delete Payment"
//                   )}
//                 </Button>
//               </div>
//             </ModalFooter>
//           </>
//         )}
//       </ModalContent>
//     </Modal>
//   );
// }
// function ReceiptModal({
//   isOpen,
//   onOpenChange,
//   paymentGroupId,
// }: {
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   paymentGroupId: string;
//   studentId?: string; // Optional since not used
// }) {
//   const [receiptData, receiptLoading] = useData(
//     getReceiptData,
//     () => {},
//     paymentGroupId
//   );

//   return (
//     <Modal
//       isOpen={isOpen}
//       onOpenChange={onOpenChange}
//       size="2xl"
//       scrollBehavior="inside"
//       classNames={{
//         base: "bg-gradient-to-br from-white to-default-50/80 mx-2 sm:mx-0",
//         header: "border-b border-default-200/50 p-4 sm:p-6",
//         body: "p-4 sm:p-6",
//         footer: "border-t border-default-200/50 p-4 sm:p-6",
//       }}
//     >
//       <ModalContent>
//         {(onClose) => (
//           <>
//             <ModalHeader className="flex flex-col gap-1">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-primary/10 rounded-lg">
//                   <FileImage className="size-5 text-primary" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-default-800">
//                     Payment Receipt
//                   </h3>
//                   <p className="text-sm text-default-600 font-normal">
//                     {receiptData?.studentName || "Loading..."}
//                   </p>
//                 </div>
//               </div>
//             </ModalHeader>
//             <ModalBody>
//               {receiptLoading ? (
//                 <div className="flex items-center justify-center h-64">
//                   <div className="flex flex-col items-center gap-3">
//                     <Loader className="size-8 animate-spin text-primary" />
//                     <p className="text-default-600">Loading receipt...</p>
//                   </div>
//                 </div>
//               ) : receiptData ? (
//                 <div className="space-y-4">
//                   <div className="relative group">
//                     <img
//                       src={receiptData.receiptUrl}
//                       alt="Payment Receipt"
//                       className="w-full h-auto rounded-lg border border-default-200/50 shadow-md group-hover:shadow-lg transition-shadow"
//                       onError={(e) => {
//                         e.currentTarget.src = "/placeholder-receipt.png";
//                       }}
//                     />
//                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
//                   </div>
//                   <div className="flex items-center gap-2 text-sm text-default-600">
//                     <Eye className="size-4" />
//                     <span>Click image to view full size</span>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex items-center justify-center h-64">
//                   <div className="flex flex-col items-center gap-3 text-center">
//                     <div className="p-4 bg-danger/10 rounded-full">
//                       <X className="size-8 text-danger" />
//                     </div>
//                     <div>
//                       <p className="font-medium text-default-800">
//                         Receipt not found
//                       </p>
//                       <p className="text-sm text-default-600">
//                         The receipt image could not be loaded
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </ModalBody>
//             <ModalFooter>
//               <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
//                 <Button
//                   color="default"
//                   variant="light"
//                   onPress={onClose}
//                   className="order-2 sm:order-1 min-h-[44px] sm:min-h-[36px] w-full sm:w-auto"
//                 >
//                   Close
//                 </Button>
//                 {receiptData && (
//                   <Button
//                     color="primary"
//                     startContent={<Download className="size-4" />}
//                     as="a"
//                     href={receiptData.receiptUrl}
//                     download
//                     className="order-1 sm:order-2 min-h-[44px] sm:min-h-[36px] w-full sm:w-auto"
//                   >
//                     Download
//                   </Button>
//                 )}
//               </div>
//             </ModalFooter>
//           </>
//         )}
//       </ModalContent>
//     </Modal>
//   );
// }

// export function Payment() {
//   const [filter, setFilter] = useState<Filter>({
//     currentPage: 1,
//     row: 50,
//     search: "",
//     sort: true,
//   });
//   const [selected, setSelected] = useState("");
//   const [showPayModal, setShowPayModal] = useState(false);

//   const [data, isLoading, refresh] = useData(
//     getStudents,
//     (data) => {
//       const value =
//         data.list.find((v) => v.id === selected)?.id ?? data.list[0].id;
//       if (value) {
//         setSelected(value);
//       }
//     },
//     filter
//   );

//   return (
//     <div className="md:p-2 lg:p-5 grid gap-2 md:grid-cols-2 overflow-hidden ">
//       <div className="max-md:p-2 flex-1 grid grid-rows-[auto_1fr_auto] gap-2 overflow-hidden ">
//         <SearchInput
//           total={data?.list.length ?? 0}
//           search={filter.search}
//           setSearch={(search) => setFilter((prev) => ({ ...prev, search }))}
//         />
//         {isLoading || !data ? (
//           <Skeleton className="" />
//         ) : (
//           <ScrollShadow className="pb-40 flex flex-wrap gap-4 auto-rows-min ">
//             {data.list.map(
//               (
//                 {
//                   id,
//                   firstName,
//                   fatherName,
//                   lastName,
//                   phoneNumber,
//                   status,
//                   roomStudent,
//                 },
//                 i
//               ) => (
//                 <Button
//                   key={i + ""}
//                   as={"label"}
//                   htmlFor="payment"
//                   className={cn(
//                     "h-fit p-5 shrink-0 border flex flex-col items-stretch text-start gap-2 ",
//                     selected == id
//                       ? "bg-primary/20 border-primary "
//                       : "bg-default-50/40 border-default-50/80 "
//                   )}
//                   onPress={() => setSelected(id)}
//                 >
//                   <div className="grid gap-2 grid-cols-[1fr_auto] items-center">
//                     <span className="capitalize">
//                       {firstName} {fatherName} {lastName}
//                     </span>
//                     <Chip
//                       variant="flat"
//                       color={status == "active" ? "success" : "danger"}
//                       className=""
//                     >
//                       {status}
//                     </Chip>
//                   </div>
//                   <div className="grid gap-2 grid-cols-2 items-center ">
//                     <span className="">{phoneNumber}</span>
//                     <div className="flex gap-2">
//                       {phoneNumber &&
//                         [
//                           {
//                             src: "/whatsapp.svg",
//                             url: `https://wa.me/${phoneNumber}`,
//                           },
//                           {
//                             src: "/telegram.svg",
//                             url: `https://t.me/+${phoneNumber}`,
//                           },
//                         ].map(({ url, src }, i) => (
//                           <Button
//                             key={i + ""}
//                             isIconOnly
//                             color="primary"
//                             variant="flat"
//                             as={Link}
//                             href={url}
//                           >
//                             <Image
//                               alt=""
//                               src={src}
//                               width={1000}
//                               height={1000}
//                               className="size-4"
//                             />
//                           </Button>
//                         ))}
//                     </div>
//                   </div>
//                   <div className="grid gap-2 grid-cols-2 ">
//                     <span className="">Teacher</span>
//                     <span className="">
//                       {roomStudent?.teacher?.firstName ?? "-NO-Teacher-"}{" "}
//                       {roomStudent?.teacher?.fatherName}
//                       {roomStudent?.teacher?.lastName}
//                     </span>
//                   </div>
//                 </Button>
//               )
//             )}
//           </ScrollShadow>
//         )}

//         <PaginationComponent
//           sort={filter.sort}
//           setSort={() => setFilter((prev) => ({ ...prev, sort: !prev.sort }))}
//           total={Math.ceil((data?.totalData ?? 0) / filter.row)}
//           page={filter.currentPage}
//           setPage={(currentPage) =>
//             setFilter((prev) => ({ ...prev, currentPage }))
//           }
//           row={new Set([filter.row + ""])}
//           setRow={(row) => setFilter((prev) => ({ ...prev, row }))}
//         />
//       </div>
//       <input type="checkbox" id="payment" className="hidden peer/payment " />
//       <PaymentList
//         selected={selected}
//         onPaymentClick={() => setShowPayModal(true)}
//       />

//       {showPayModal && selected && (
//         <Pay
//           id={selected}
//           onClose={() => setShowPayModal(false)}
//           refresh={refresh}
//         />
//       )}
//     </div>
//   );
// }

// function PaymentList({
//   selected,
//   onPaymentClick,
// }: {
//   selected: string;
//   onPaymentClick: () => void;
// }) {
//   // const { lang } = useParams<{ lang: string }>();
//   // const [months, setMonths] = useState<number[]>([]);
//   const [data, isLoading, refresh] = useData(getPayment, () => {}, selected);
//   const { data: session } = useSession();

//   // Check if user is admin (manager or controller)
//   const isAdmin =
//     session?.user?.role === "manager" || session?.user?.role === "controller";

//   // Mutation for approving/rejecting payments
//   const [updateStatus, isUpdating] = useMutation(approved, (result) => {
//     if (result.status) {
//       refresh(); // Refresh the payment list after status update
//     }
//   });

//   // Mutation for deleting payments
//   const [deletePaymentMutation, isDeleting] = useMutation(
//     deletePayment,
//     (result) => {
//       if (result.status) {
//         refresh(); // Refresh the payment list after deletion
//         setSelectedPaymentForDelete(null);
//       }
//     }
//   );

//   const handleStatusUpdate = (
//     paymentGroupId: string,
//     status: "approved" | "rejected" | "paid"
//   ) => {
//     updateStatus(paymentGroupId, status);
//   };

//   const handleDeletePayment = (paymentGroupId: string) => {
//     deletePaymentMutation(paymentGroupId);
//   };

//   const {
//     isOpen: isReceiptOpen,
//     onOpen: onReceiptOpen,
//     onOpenChange: onReceiptOpenChange,
//   } = useDisclosure();
//   const [selectedReceiptId, setSelectedReceiptId] = useState("");

//   // Delete confirmation modal state
//   const {
//     isOpen: isDeleteOpen,
//     onOpen: onDeleteOpen,
//     onOpenChange: onDeleteOpenChange,
//   } = useDisclosure();
//   const [selectedPaymentForDelete, setSelectedPaymentForDelete] =
//     useState<PaymentGroupData | null>(null);

//   const handleReceiptView = (paymentGroupId: string) => {
//     setSelectedReceiptId(paymentGroupId);
//     onReceiptOpen();
//   };

//   const handleDeleteClick = (paymentGroup: PaymentGroupData) => {
//     setSelectedPaymentForDelete(paymentGroup);
//     onDeleteOpen();
//   };

//   // const session = useSession();

//   return (
//     <div className="z-20 max-md:backdrop-blur-3xl overflow-hidden hidden grid-rows-[auto_1fr] max-md:peer-checked/payment:grid md:grid gap-2 max-md:hidden max-md:absolute max-md:inset-0 ">
//       <div className="p-2 md:bg-default-50/50 md:rounded-xl flex gap-2 items-center ">
//         <Button
//           isIconOnly
//           variant="flat"
//           className="bg-default-50/50 lg:hidden"
//           as={"label"}
//           htmlFor="payment"
//         >
//           <ChevronLeft className="size-4" />
//         </Button>
//         <p className="flex-1 text-xl font-bold ">Payment History</p>
//         <Button
//           color="primary"
//           className=" "
//           startContent={<DollarSign className="size-4" />}
//           onPress={onPaymentClick}
//           isDisabled={!selected}
//         >
//           Pay
//         </Button>
//       </div>
//       {isLoading || !data ? (
//         <Skeleton />
//       ) : data.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-12 text-center">
//           <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mb-4">
//             <DollarSign className="w-8 h-8 text-default-400" />
//           </div>
//           <p className="text-default-500 mb-2">No payment history found</p>
//           <p className="text-sm text-default-400 mb-4">
//             Start by making your first payment
//           </p>
//           <Button
//             color="primary"
//             variant="flat"
//             onPress={onPaymentClick}
//             startContent={<DollarSign className="size-4" />}
//           >
//             Make Payment
//           </Button>
//         </div>
//       ) : (
//         <ScrollShadow
//           size={50}
//           className="p-2 sm:p-3 md:p-4 pb-20 sm:pb-32 md:pb-40 overflow-auto flex flex-col gap-4 sm:gap-5 md:gap-6 overscroll-contain"
//         >
//           {data.map(
//             (
//               { list, status, id, createdAt, price }: PaymentGroupData,
//               i: number
//             ) => {
//               const totalMonths = list.reduce(
//                 (sum: number, yearData: PaymentYearData) =>
//                   sum + yearData.months.split(",").length,
//                 0
//               );
//               // Use the stored price (always custom now)
//               const totalAmount = price && price > 0 ? Number(price) : 0;

//               return (
//                 <div
//                   key={i + ""}
//                   className="p-3 sm:p-4 md:p-5 lg:p-6 bg-gradient-to-br from-white/95 via-white/90 to-default-50/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-default-200/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] sm:hover:scale-[1.02] flex flex-col gap-4 sm:gap-5 md:gap-6"
//                 >
//                   {/* Mobile-optimized header section */}
//                   <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
//                     <div className="flex-1 space-y-2 sm:space-y-1">
//                       <div className="flex items-center gap-2">
//                         <div
//                           className={cn(
//                             "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm",
//                             status === "approved"
//                               ? "bg-success animate-pulse"
//                               : status === "rejected"
//                               ? "bg-danger"
//                               : "bg-warning animate-pulse"
//                           )}
//                         ></div>
//                         <p className="font-bold text-base sm:text-lg md:text-xl text-default-800">
//                           Payment #{i + 1}
//                         </p>
//                       </div>
//                       <p className="text-xs sm:text-sm text-default-600 flex items-start sm:items-center gap-1 flex-wrap">
//                         <Clock className="size-3 sm:size-3.5 flex-shrink-0 mt-0.5 sm:mt-0" />
//                         <span className="break-words">
//                           {new Date(createdAt || new Date()).toLocaleDateString(
//                             "en-US",
//                             {
//                               year: "numeric",
//                               month: "short",
//                               day: "numeric",
//                               hour: "2-digit",
//                               minute: "2-digit",
//                             }
//                           )}
//                         </span>
//                       </p>
//                     </div>

//                     {/* Mobile-first action buttons */}
//                     <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 w-full sm:w-auto min-w-0">
//                       <Button
//                         color="primary"
//                         variant="flat"
//                         startContent={<Eye className="size-3.5 sm:size-4" />}
//                         className="font-medium text-xs sm:text-sm backdrop-blur-sm w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
//                         size="sm"
//                         onPress={() => handleReceiptView(id)}
//                       >
//                         <span className="truncate">View Receipt</span>
//                       </Button>

//                       {/* Delete button - only show for pending payments */}
//                       {status === "paid" ? (
//                         <Button
//                           color="danger"
//                           variant="flat"
//                           startContent={
//                             <Trash2 className="size-3.5 sm:size-4" />
//                           }
//                           className="font-medium text-xs sm:text-sm backdrop-blur-sm w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
//                           size="sm"
//                           onPress={() =>
//                             handleDeleteClick({
//                               list,
//                               status,
//                               id,
//                               createdAt,
//                               price,
//                             })
//                           }
//                           isDisabled={isDeleting}
//                         >
//                           <span className="truncate">Delete</span>
//                         </Button>
//                       ) : (
//                         /* Status Button - responsive sizing */
//                         <Button
//                           color={
//                             status === "approved"
//                               ? "success"
//                               : status === "rejected"
//                               ? "danger"
//                               : "warning"
//                           }
//                           variant={
//                             status === "approved" || status === "rejected"
//                               ? "solid"
//                               : "flat"
//                           }
//                           startContent={
//                             status === "approved" ? (
//                               <CheckCircle className="size-3.5 sm:size-4" />
//                             ) : status === "rejected" ? (
//                               <CircleX className="size-3.5 sm:size-4" />
//                             ) : (
//                               <Clock className="size-3.5 sm:size-4" />
//                             )
//                           }
//                           className="font-medium text-xs sm:text-sm backdrop-blur-sm w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
//                           size="sm"
//                           isDisabled
//                         >
//                           <span className="truncate font-semibold">
//                             {status === "paid"
//                               ? "Pending"
//                               : status === "approved"
//                               ? "Approved"
//                               : "Rejected"}
//                           </span>
//                         </Button>
//                       )}
//                     </div>
//                   </div>

//                   {/* Responsive Admin Actions - Show for all payments if admin */}
//                   {isAdmin && (
//                     <div className="mt-4 p-3 sm:p-4 bg-gradient-to-br from-default-50/60 to-default-50/30 rounded-xl border border-default-200/50 shadow-sm backdrop-blur-sm">
//                       <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-3">
//                         <div className="flex items-center gap-2 min-w-0 flex-1">
//                           <Shield className="size-4 text-primary flex-shrink-0" />
//                           <span className="text-xs sm:text-sm font-semibold text-default-800 truncate">
//                             Admin Actions
//                           </span>
//                         </div>
//                         {status !== "paid" && (
//                           <div className="w-full sm:w-auto">
//                             <Button
//                               color="warning"
//                               variant="flat"
//                               size="sm"
//                               onPress={() => handleStatusUpdate(id, "paid")}
//                               isLoading={isUpdating}
//                               isDisabled={isUpdating}
//                               startContent={
//                                 <RotateCcw className="size-3 sm:size-3.5" />
//                               }
//                               className="text-xs font-medium backdrop-blur-sm w-full sm:w-auto min-h-[44px] sm:min-h-[32px]"
//                             >
//                               <span className="truncate">Reset to Pending</span>
//                             </Button>
//                           </div>
//                         )}
//                       </div>

//                       {status === "paid" ? (
//                         <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
//                           <Button
//                             color="success"
//                             variant="solid"
//                             size="sm"
//                             onPress={() => handleStatusUpdate(id, "approved")}
//                             isLoading={isUpdating}
//                             isDisabled={isUpdating}
//                             startContent={
//                               !isUpdating ? (
//                                 <CheckCircle className="size-3.5 sm:size-4" />
//                               ) : undefined
//                             }
//                             className="font-medium shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm min-h-[44px] sm:min-h-[36px]"
//                           >
//                             {isUpdating ? (
//                               <>
//                                 <Loader className="size-3.5 sm:size-4 animate-spin" />
//                                 <span className="text-xs sm:text-sm">
//                                   Processing...
//                                 </span>
//                               </>
//                             ) : (
//                               <span className="text-xs sm:text-sm font-semibold">
//                                 Approve Payment
//                               </span>
//                             )}
//                           </Button>
//                           <Button
//                             color="danger"
//                             variant="solid"
//                             size="sm"
//                             onPress={() => handleStatusUpdate(id, "rejected")}
//                             isLoading={isUpdating}
//                             isDisabled={isUpdating}
//                             startContent={
//                               !isUpdating ? (
//                                 <X className="size-3.5 sm:size-4" />
//                               ) : undefined
//                             }
//                             className="font-medium shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm min-h-[44px] sm:min-h-[36px]"
//                           >
//                             {isUpdating ? (
//                               <>
//                                 <Loader className="size-3.5 sm:size-4 animate-spin" />
//                                 <span className="text-xs sm:text-sm">
//                                   Processing...
//                                 </span>
//                               </>
//                             ) : (
//                               <span className="text-xs sm:text-sm font-semibold">
//                                 Reject Payment
//                               </span>
//                             )}
//                           </Button>
//                         </div>
//                       ) : (
//                         <div className="text-center p-3 bg-default-50/50 rounded-xl">
//                           <p className="text-xs sm:text-sm text-default-600 mb-1">
//                             Status:
//                             <span
//                               className={cn(
//                                 "ml-1 font-bold",
//                                 status === "approved"
//                                   ? "text-success"
//                                   : "text-danger"
//                               )}
//                             >
//                               {status === "approved" ? "Approved" : "Rejected"}
//                             </span>
//                           </p>
//                           <p className="text-xs text-default-500">
//                             Use &quot;Reset to Pending&quot; to modify
//                           </p>
//                         </div>
//                       )}

//                       {/* Notification indicator */}
//                       <div className="mt-3 pt-3 border-t border-default-200/40">
//                         <div className="flex items-center gap-2 text-xs text-default-500">
//                           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse flex-shrink-0"></div>
//                           <span className="text-xs leading-tight">
//                             All actions notify the student immediately
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Responsive Payment Summary Card */}
//                   <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl sm:rounded-2xl border border-primary/20 shadow-sm backdrop-blur-sm">
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
//                       <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
//                         <div className="flex items-center gap-2">
//                           <div
//                             className={cn(
//                               "w-2 h-2 rounded-full flex-shrink-0",
//                               status === "approved"
//                                 ? "bg-success"
//                                 : status === "rejected"
//                                 ? "bg-danger"
//                                 : "bg-warning"
//                             )}
//                           ></div>
//                           <p className="text-xs sm:text-sm font-semibold text-default-800 truncate">
//                             {totalMonths} month{totalMonths !== 1 ? "s" : ""} •
//                             Payment Summary
//                           </p>
//                         </div>
//                         <div className="flex items-center gap-2 text-xs text-default-600">
//                           <span className="text-xs">ID:</span>
//                           <code className="px-1.5 py-0.5 bg-default-100 rounded text-xs font-mono truncate max-w-[120px] sm:max-w-none">
//                             {id ? id.slice(-8) : "N/A"}
//                           </code>
//                         </div>
//                       </div>
//                       <div className="flex items-center justify-between sm:justify-end sm:text-right gap-3">
//                         <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl flex-shrink-0">
//                           <DollarSign className="size-5 sm:size-6 md:size-8 text-primary" />
//                         </div>
//                         <div className="text-right space-y-0.5 sm:space-y-1">
//                           <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary leading-tight">
//                             {totalAmount.toLocaleString()} ETB
//                           </p>
//                           <p className="text-xs sm:text-sm text-default-500 font-medium">
//                             Total Amount
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                   {/* Responsive Month Details */}
//                   {list.map(({ year, months }: PaymentYearData, i: number) => (
//                     <div
//                       key={i + ""}
//                       className="relative p-3 sm:p-4 md:p-5 pt-6 md:pt-7 border border-default-200/60 rounded-xl bg-gradient-to-br from-default-50/60 to-default-50/20 shadow-sm hover:shadow-md transition-shadow duration-200 backdrop-blur-sm"
//                     >
//                       {/* Responsive Year Badge */}
//                       <div className="absolute -top-2.5 sm:-top-3 left-3 sm:left-5 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-primary to-primary/80 text-white border border-primary/20 rounded-full text-xs sm:text-sm font-semibold shadow-md">
//                         <span className="flex items-center gap-1 sm:gap-1.5">
//                           <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/80 rounded-full flex-shrink-0"></div>
//                           <span>{year}</span>
//                         </span>
//                       </div>

//                       {/* Responsive month grid */}
//                       <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
//                         {months
//                           .split(",")
//                           .map(Number)
//                           .map((monthNum: number) => (
//                             <div
//                               key={monthNum}
//                               className={cn(
//                                 "inline-flex items-center justify-center py-2 sm:py-2.5 px-2 sm:px-3 border rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm backdrop-blur-sm min-h-[40px] sm:min-h-[44px]",
//                                 status === "approved"
//                                   ? "border-success/40 bg-gradient-to-br from-success/15 to-success/5 text-success-800 shadow-success/10"
//                                   : status === "rejected"
//                                   ? "border-danger/40 bg-gradient-to-br from-danger/15 to-danger/5 text-danger-800 shadow-danger/10"
//                                   : "border-warning/40 bg-gradient-to-br from-warning/15 to-warning/5 text-warning-800 shadow-warning/10"
//                               )}
//                             >
//                               <span className="flex items-center gap-1 sm:gap-1.5">
//                                 {status === "approved" && (
//                                   <CheckCircle className="size-3 sm:size-3.5 text-success-600 flex-shrink-0" />
//                                 )}
//                                 {status === "rejected" && (
//                                   <CircleX className="size-3 sm:size-3.5 text-danger-600 flex-shrink-0" />
//                                 )}
//                                 {status === "paid" && (
//                                   <Clock className="size-3 sm:size-3.5 text-warning-600 flex-shrink-0" />
//                                 )}
//                                 <span className="truncate">
//                                   {new Date(
//                                     2025,
//                                     monthNum - 1,
//                                     1
//                                   ).toLocaleString("default", {
//                                     month: "short",
//                                   })}
//                                 </span>
//                               </span>
//                             </div>
//                           ))}
//                       </div>

//                       {/* Responsive year subtotal */}
//                       <div className="w-full mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-default-200/40">
//                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
//                           <div className="flex items-center gap-2">
//                             <div
//                               className={cn(
//                                 "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0",
//                                 status === "approved"
//                                   ? "bg-success animate-pulse"
//                                   : status === "rejected"
//                                   ? "bg-danger"
//                                   : "bg-warning animate-pulse"
//                               )}
//                             ></div>
//                             <span className="text-default-700 font-medium truncate">
//                               {year}: {months.split(",").length} month
//                               {months.split(",").length !== 1 ? "s" : ""}
//                             </span>
//                           </div>
//                           <div className="flex items-center gap-2 justify-between sm:justify-end">
//                             <span className="text-xs text-default-500 flex-shrink-0">
//                               Subtotal:
//                             </span>
//                             <span className="font-bold text-primary text-sm sm:text-base">
//                               {price && price > 0
//                                 ? `${(
//                                     (price / totalMonths) *
//                                     months.split(",").length
//                                   ).toLocaleString()} ETB`
//                                 : "Amount not set"}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               );
//             }
//           )}
//         </ScrollShadow>
//       )}
//       {/* <Pay
//         {...{
//           id: selected,
//           months,
//           onClose() {
//             setMonths([]);
//           },
//           refresh,
//         }}
//       /> */}
//       {/* Receipt Modal */}
//       <ReceiptModal
//         isOpen={isReceiptOpen}
//         onOpenChange={onReceiptOpenChange}
//         paymentGroupId={selectedReceiptId}
//         studentId={selected}
//       />

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmationModal
//         isOpen={isDeleteOpen}
//         onOpenChange={onDeleteOpenChange}
//         paymentGroup={selectedPaymentForDelete}
//         onConfirm={() =>
//           selectedPaymentForDelete &&
//           handleDeletePayment(selectedPaymentForDelete.id)
//         }
//         isDeleting={isDeleting}
//       />
//     </div>
//   );
// }
