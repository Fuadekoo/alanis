// import useData from "@/hooks/useData";
// import { useState } from "react";
// import { assignStudent, getStudentList, getStudentStatus } from "./actions";
// import {
//   Button,
//   Chip,
//   CModal,
//   DatePicker,
//   Form,
//   Input,
//   ModalBody,
//   ModalContent,
//   ModalFooter,
//   ModalHeader,
//   ScrollShadow,
//   Select,
//   SelectItem,
//   Skeleton,
// } from "@/components/ui/heroui";
// import { ChevronLeft, Pen, Search } from "lucide-react";
// import { getLocalTimeZone, parseDate } from "@internationalized/date";
// import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
// import { assignSchema } from "./schema";

// export function Detail({ selected }: { selected: string }) {
//   const [filter, setFilter] = useState({
//     date: new Date(),
//     search: "",
//   });

//   const [data, isLoading, refresh] = useData(
//     getStudentStatus,
//     () => {},
//     selected,
//     filter
//   );

//   const form = useRegistration(assignStudent, assignSchema, (state) => {
//     if (state.status) {
//       refresh();
//     }
//   });

//   return (
//     <>
//       <input
//         id="teacher-detail"
//         type="checkbox"
//         className="hidden peer/teacher-detail"
//       />
//       <div className="max-md:z-20 max-md:absolute max-md:inset-0 max-md:size-full max-md:p-2 max-md:bg-default-50/30 backdrop-blur-3xl max-md:hidden max-md:peer-checked/teacher-detail:grid md:grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
//         <div className="flex max-md:flex-col gap-2 ">
//           <div className="flex-1 flex gap-2">
//             <Button
//               as={"label"}
//               htmlFor="teacher-detail"
//               isIconOnly
//               variant="flat"
//               className="md:hidden "
//             >
//               <ChevronLeft className="size-4" />
//             </Button>
//             <Input
//               startContent={<Search className="size-4" />}
//               placeholder={"የተማሪዉን ስም እዚህ ይፃፉ ...."}
//               className="flex-1"
//               value={filter.search}
//               onValueChange={(search) =>
//                 setFilter((prev) => ({ ...prev, search }))
//               }
//             />
//           </div>
//           <div className="flex-1 flex gap-2 ">
//             <DatePicker
//               className="flex-1 "
//               value={parseDate(filter.date.toISOString().split("T")[0])}
//               onChange={(date) =>
//                 date &&
//                 setFilter((prev) => ({
//                   ...prev,
//                   date: date.toDate(getLocalTimeZone()),
//                 }))
//               }
//             />
//             <Button
//               color="primary"
//               onPress={() => form.edit({ teacherId: selected, studentId: "" })}
//               className="flex-1 "
//             >
//               ተማሪ ይመድቡ
//             </Button>
//           </div>
//         </div>
//         {isLoading || !data ? (
//           <Skeleton />
//         ) : (
//           <ScrollShadow className="flex flex-col divide-y divide-default-50/40 ">
//             {data.map((v, i) => (
//               <div key={i + ""} className="p-2 flex gap-2 max-md:flex-col ">
//                 <p className="flex-1">
//                   {v.firstName} {v.fatherName} {v.lastName}
//                 </p>
//                 <div className="w-fit flex gap-2  ">
//                   <Chip
//                     color={
//                       v.status === "not sent"
//                         ? "danger"
//                         : v.status === "sent"
//                         ? "warning"
//                         : "success"
//                     }
//                     variant="flat"
//                   >
//                     {v.status == "not sent"
//                       ? "አልተላከም"
//                       : v.status == "sent"
//                       ? "ተልኳል"
//                       : "ተመልሷል"}
//                   </Chip>
//                   <p className="w-24">
//                     {v.sentTime?.toLocaleTimeString() ?? "_- : _- _-"}
//                   </p>
//                   <p className="w-24">
//                     {v.replayedTime?.toLocaleTimeString() ?? "_- : _- _-"}
//                   </p>
//                   <Button
//                     isIconOnly
//                     size="sm"
//                     color="primary"
//                     variant="flat"
//                     onPress={() =>
//                       form.edit({ teacherId: selected, studentId: v.id })
//                     }
//                   >
//                     <Pen className="size-4" />
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </ScrollShadow>
//         )}
//       </div>
//       <Assignment form={form} />
//     </>
//   );
// }

// function Assignment({ form }: { form: UseRegistration<typeof assignStudent> }) {
//   const [students] = useData(getStudentList, () => {});

//   return (
//     <CModal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
//       <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
//         <ModalContent>
//           {!students ? (
//             <Skeleton className="" />
//           ) : (
//             (onClose) => (
//               <>
//                 <ModalHeader>ተማሪ ምደባ</ModalHeader>
//                 <ModalBody>
//                   <Select
//                     label="Student"
//                     labelPlacement="outside"
//                     {...form.register("studentId")}
//                   >
//                     {students.map(({ id, firstName, fatherName, lastName }) => (
//                       <SelectItem
//                         key={id}
//                       >{`${firstName} ${fatherName} ${lastName}`}</SelectItem>
//                     ))}
//                   </Select>
//                 </ModalBody>
//                 <ModalFooter>
//                   <Button variant="flat" onPress={onClose}>
//                     ይመለሱ
//                   </Button>
//                   <Button
//                     color="primary"
//                     type="submit"
//                     isLoading={form.isLoading}
//                   >
//                     ያስገቡ
//                   </Button>
//                 </ModalFooter>
//               </>
//             )
//           )}
//         </ModalContent>
//       </Form>
//     </CModal>
//   );
// }
