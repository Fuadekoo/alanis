// "use client";

// import {
//   Button,
//   CModal,
//   ModalBody,
//   ModalContent,
//   ModalFooter,
//   ModalHeader,
//   ScrollShadow,
//   Skeleton,
// } from "@/components/ui/heroui";
// import useData from "@/hooks/useData";
// import React from "react";
// import { deleteGroup, getGroups } from "./actions";
// import { useParams } from "next/navigation";
// import useAmharic from "@/hooks/useAmharic";
// import useDelete, { UseDelete } from "@/hooks/useDelete";

// export function Group() {
//   const isAm = useAmharic();
//   const { lang } = useParams<{ lang: string }>();
//   const [data, isLoading, refresh] = useData(getGroups, () => {});
//   const deletion = useDelete(deleteGroup, (state) => {
//     if (state.status) {
//       refresh();
//     }
//   });

//   return (
//     <>
//       {isLoading || !data ? (
//         <Skeleton className="md:w-xl place-self-center h-full" />
//       ) : (
//         <ScrollShadow className="p-2 md:w-xl pb-40 place-self-center h-full flex flex-col gap-2 ">
//           <div className="p-5 bg-default-50/20 rounded-xl ">
//             {lang == "am"
//               ? "ተጨማሪ ቡድኖችን ለመጨመር የአልአኒስ ቦትን የቡድን አስተዳዳሪ ያድርጉት"
//               : "To add more groups, make Alanis Bot the group administrator"}
//           </div>
//           {data.map(({ id, name, teacher, student }, i) => (
//             <div key={i + ""} className="p-2 bg-default-50/20 rounded-xl ">
//               <div className="flex gap-2 ">
//                 <p className="flex-1">{name}</p>
//                 <Button
//                   color="danger"
//                   variant="flat"
//                   onPress={() => deletion.open(id)}
//                 >
//                   {isAm ? "ይሰርዙ" : "delete"}
//                 </Button>
//               </div>
//               <div className="flex gap-2">
//                 <p className="flex-1">
//                   {teacher?.firstName ?? "_-_-_-_-_-_-"}{" "}
//                   {teacher?.fatherName ?? "_-_-_-_-_-_-"}{" "}
//                   {teacher?.lastName ?? "_-_-_-_-_-_-"}
//                 </p>
//                 <p className="flex-1">
//                   {student} {isAm ? "ተማሪዎች" : "students"}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </ScrollShadow>
//       )}
//       <Deletion deletion={deletion} />
//     </>
//   );
// }

// function Deletion({ deletion }: { deletion: UseDelete }) {
//   const isAm = useAmharic();
//   return (
//     <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
//       <ModalContent>
//         {(onClose) => (
//           <>
//             <ModalHeader>{isAm ? "ግሩፕ መሰረዝ" : "Group Deletion"}</ModalHeader>
//             <ModalBody>
//               <p className="text-center text-balance">
//                 {isAm ? (
//                   <>
//                     እርግጠኛ ነህ ቡድኑን <span className="text-danger">መሰረዝ</span>{" "}
//                     ትፈልጋለህ? ያንን ካደረግክ ሁሉም ተዛማጅ መረጃዎች{" "}
//                     <span className="text-danger">ይሰረዛሉ</span>!!
//                   </>
//                 ) : (
//                   <>
//                     Are you sure do you want to{" "}
//                     <span className="text-danger">delete</span> the group? if
//                     you do that all related data will be{" "}
//                     <span className="text-danger">erased</span>!!
//                   </>
//                 )}
//               </p>
//             </ModalBody>
//             <ModalFooter>
//               <Button variant="flat" onPress={onClose}>
//                 {isAm ? "ይመለሱ" : "Back"}
//               </Button>
//               <Button
//                 color="danger"
//                 onPress={deletion.handle}
//                 isLoading={deletion.isLoading}
//               >
//                 {isAm ? "ይሰርዙ" : "Delete"}
//               </Button>
//             </ModalFooter>
//           </>
//         )}
//       </ModalContent>
//     </CModal>
//   );
// }
