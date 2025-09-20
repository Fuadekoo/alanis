// import useData from "@/hooks/useData";
// import { getStudents, getStudentStatus } from "./action";
// import { useState } from "react";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { Button, ScrollShadow, Skeleton } from "@/components/ui/heroui";
// import { Chip, cn } from "@heroui/react";
// // import useAmharic from "@/hooks/useAmharic";

// type Student = Awaited<ReturnType<typeof getStudents>>[0];

// export function Detail({ selected }: { selected: Student | undefined }) {
//   // const isAm = useAmharic();
//   const [filter, setFilter] = useState({
//     year: new Date().getFullYear(),
//     month: new Date().getMonth(),
//   });
//   const [data, isLoading] = useData(
//     getStudentStatus,
//     () => {},
//     selected?.id ?? "unknown",
//     filter
//   );

//   return (
//     <>
//       <input
//         id="student-detail"
//         type="checkbox"
//         className="hidden peer/student-detail"
//       />
//       <div className="overflow-hidden max-md:z-20 max-md:absolute max-md:inset-0 max-md:size-full max-md:p-2 max-md:bg-default-50/30 backdrop-blur-3xl max-md:hidden max-md:peer-checked/student-detail:grid md:grid grid-rows-[auto_1fr] gap-2 ">
//         <div className="flex gap-2">
//           <Button
//             isIconOnly
//             variant="flat"
//             as={"label"}
//             htmlFor="student-detail"
//             className="md:hidden"
//           >
//             <ChevronLeft className="size-4" />
//           </Button>
//           <div className="flex-1 flex rounded-xl overflow-hidden ">
//             <div
//               className="p-2 bg-default-50/80 grid place-content-center "
//               onClick={() =>
//                 setFilter((prev) => ({ ...prev, year: prev.year - 1 }))
//               }
//             >
//               <ChevronLeft className="size-4" />
//             </div>
//             <div className="p-2 flex-1 bg-default-50/30 text-center">
//               {filter.year}
//             </div>
//             <div
//               className="p-2 bg-default-50/80 grid place-content-center "
//               onClick={() => {
//                 setFilter((prev) => {
//                   const year = new Date().getFullYear();
//                   if (prev.year + 1 == year) {
//                   }

//                   return {
//                     ...prev,
//                     year: prev.year == year ? prev.year : prev.year + 1,
//                     ...(prev.year + 1 == year
//                       ? {
//                           month: new Date().getMonth(),
//                         }
//                       : {}),
//                   };
//                 });
//               }}
//             >
//               <ChevronRight className="size-4" />
//             </div>
//           </div>
//           {/*  */}
//           <div className="flex-1 flex rounded-xl overflow-hidden ">
//             <div
//               className="p-2 bg-default-50/80 grid place-content-center "
//               onClick={() =>
//                 setFilter((prev) => ({
//                   ...prev,
//                   month: prev.month == 0 ? 11 : prev.month - 1,
//                 }))
//               }
//             >
//               <ChevronLeft className="size-4" />
//             </div>
//             <div className="p-2 flex-1 bg-default-50/30 text-center">
//               {new Date(2025, filter.month, 1).toString().slice(4, 7)}
//             </div>
//             <div
//               className="p-2 bg-default-50/80 grid place-content-center "
//               onClick={() =>
//                 setFilter((prev) => ({
//                   ...prev,
//                   month:
//                     prev.year == new Date().getFullYear() &&
//                     prev.month == new Date().getMonth()
//                       ? prev.month
//                       : prev.month == 11
//                       ? 0
//                       : prev.month + 1,
//                 }))
//               }
//             >
//               <ChevronRight className="size-4" />
//             </div>
//           </div>
//         </div>
//         {isLoading || !data ? (
//           <Skeleton />
//         ) : (
//           <ScrollShadow className="pb-40 flex flex-col divide-y divide-default-50/40 ">
//             {data.map(({ date, status, sentTime, replayedTime }, i) => (
//               <div
//                 key={i + ""}
//                 className={cn(
//                   "w-full h-fit p-2 shrink-0 flex gap-4  text-start "
//                 )}
//               >
//                 <p className="flex-1 ">{date.toString().slice(0, 10)}</p>
//                 <Chip
//                   color={
//                     status === "not sent"
//                       ? "danger"
//                       : status == "sent"
//                       ? "warning"
//                       : "success"
//                   }
//                   variant="flat"
//                 >
//                   {status == "not sent"
//                     ? "አልተላከም"
//                     : status == "sent"
//                     ? "ተልኳል"
//                     : "ተመልሷል"}
//                 </Chip>
//                 <p className="">
//                   {sentTime?.toLocaleTimeString() ?? "_- : _- _-"}
//                 </p>
//                 <p className="">
//                   {replayedTime?.toLocaleTimeString() ?? "_- : _- _-"}
//                 </p>
//               </div>
//             ))}
//           </ScrollShadow>
//         )}
//       </div>
//     </>
//   );
// }
