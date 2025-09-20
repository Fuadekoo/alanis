// import { Button, Input, ScrollShadow, Skeleton } from "@/components/ui/heroui";
// import { cn } from "@heroui/react";
// import { Pen, Search, Trash } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { getTeachers, registerTeacher } from "./actions";
// import { UseRegistration } from "@/hooks/useRegistration";
// import { UseDelete } from "@/hooks/useDelete";

// export function List({
//   search,
//   setSearch,
//   teacherData,
//   isLoading,
//   selected,
//   setSelected,
//   form,
//   deletion,
// }: {
//   search: string;
//   setSearch: (value: string) => void;
//   teacherData: Awaited<ReturnType<typeof getTeachers>> | undefined;
//   isLoading: boolean;
//   selected: string;
//   setSelected: React.Dispatch<React.SetStateAction<string>>;
//   form: UseRegistration<typeof registerTeacher>;
//   deletion: UseDelete;
// }) {
//   return (
//     <div className="  grid gap-2 grid-rows-[auto_1fr] overflow-hidden ">
//       <div className="flex gap-2 rounded-xl ">
//         <Input
//           startContent={<Search className="size-4" />}
//           placeholder="የመምህሩን ስም እዚህ ይፃፉ ...."
//           className="flex-1"
//           value={search}
//           onValueChange={setSearch}
//         />
//         <Button color="primary" onPress={form.add}>
//           አዲስ መምህር
//         </Button>
//       </div>
//       {isLoading || !teacherData ? (
//         <Skeleton />
//       ) : (
//         <ScrollShadow className="pb-40 flex gap-2 md:gap-5 flex-col  ">
//           {teacherData.map(
//             (
//               {
//                 id,
//                 firstName,
//                 fatherName,
//                 lastName,
//                 phoneNumber,
//                 username,
//                 group,
//               },
//               i
//             ) => (
//               <Button
//                 key={i + ""}
//                 as={"label"}
//                 htmlFor="teacher-detail"
//                 className={cn(
//                   "w-full h-fit shrink-0 p-2 md:p-5 border backdrop-blur-3xl rounded-xl flex gap-2 flex-col items-stretch ",
//                   selected == id
//                     ? "bg-primary/20 border-primary"
//                     : "bg-default-50/50 border-default-50/80"
//                 )}
//                 onPress={() => setSelected(id)}
//               >
//                 <div className="flex gap-2 items-center ">
//                   <p className="flex-1 capitalize ">
//                     {firstName} {fatherName} {lastName}
//                   </p>
//                   <div className="flex gap-2">
//                     <Button
//                       isIconOnly
//                       color="primary"
//                       variant="flat"
//                       onPress={() => {
//                         form.edit({
//                           id,
//                           firstName,
//                           fatherName,
//                           lastName,
//                           phoneNumber,
//                           username,
//                           password: "",
//                           groupId: group?.id ?? "",
//                         });
//                       }}
//                     >
//                       <Pen className="size-4" />
//                     </Button>
//                     <Button
//                       isIconOnly
//                       color="danger"
//                       variant="flat"
//                       onPress={() => deletion.open(id)}
//                     >
//                       <Trash className="size-4" />
//                     </Button>
//                   </div>
//                 </div>
//                 <p className="grid grid-cols-2 items-center ">
//                   <span className="">{phoneNumber}</span>
//                   <div className="flex gap-2">
//                     <Button
//                       isIconOnly
//                       variant="flat"
//                       color="primary"
//                       as={Link}
//                       href={`https://wa.me/${phoneNumber}`}
//                     >
//                       <Image
//                         alt=""
//                         src={"/whatsapp.svg"}
//                         className="size-6 "
//                         width={1000}
//                         height={1000}
//                       />
//                     </Button>
//                     <Button
//                       isIconOnly
//                       variant="flat"
//                       color="primary"
//                       as={Link}
//                       href={`https://t.me/+${phoneNumber}`}
//                     >
//                       <Image
//                         alt=""
//                         src={"/telegram.svg"}
//                         className="size-6 "
//                         width={1000}
//                         height={1000}
//                       />
//                     </Button>
//                   </div>
//                 </p>
//                 <p className="grid grid-cols-2">
//                   <span className="">ግሩፕ </span>
//                   <span className="">{group?.name ?? "_-_-_-_-_-_-"}</span>
//                 </p>
//               </Button>
//             )
//           )}
//         </ScrollShadow>
//       )}
//     </div>
//   );
// }
