// import { getStudents, registerStudent } from "./action";
// import { Button, Input, ScrollShadow, Skeleton } from "@/components/ui/heroui";
// import { Pen, Search, Trash } from "lucide-react";
// import { cn } from "@heroui/react";
// import Link from "next/link";
// import Image from "next/image";
// import { UseRegistration } from "@/hooks/useRegistration";
// import { UseDelete } from "@/hooks/useDelete";

// type Student = Awaited<ReturnType<typeof getStudents>>[0];

// export function List({
//   search,
//   setSearch,
//   data,
//   isLoading,
//   selected,
//   setSelected,
//   form,
//   deletion,
// }: {
//   search: string;
//   setSearch: (value: string) => void;
//   data: Student[] | undefined;
//   isLoading: boolean;
//   selected: Student | undefined;
//   setSelected: React.Dispatch<React.SetStateAction<Student | undefined>>;
//   form: UseRegistration<typeof registerStudent>;
//   deletion: UseDelete;
// }) {
//   return (
//     <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden ">
//       <div className=" grid gap-2 grid-cols-[1fr_auto] ">
//         <Input
//           startContent={<Search className="size-4" />}
//           placeholder={"የተማሪዉን ስም እዚህ ይፃፉ ... "}
//           className=""
//           value={search}
//           onValueChange={setSearch}
//         />
//         <Button color="primary" onPress={form.add}>
//           አዲስ ተማሪ
//         </Button>
//       </div>
//       {isLoading || !data ? (
//         <Skeleton />
//       ) : (
//         <ScrollShadow className="pb-40 flex gap-2 flex-col  ">
//           {data.map((v, i) => (
//             <Button
//               key={i + ""}
//               as={"label"}
//               htmlFor="student-detail"
//               className={cn(
//                 "w-full h-fit p-5 shrink-0 border flex gap-2 flex-col items-stretch text-start ",
//                 selected?.id == v.id
//                   ? "bg-primary/20 border-primary "
//                   : "bg-default-50/40 border-default-50/80 "
//               )}
//               onPress={() => setSelected(v)}
//             >
//               <div className="grid gap-2 grid-cols-2 items-center">
//                 <span className="capitalize">
//                   {v.firstName} {v.fatherName} {v.lastName}
//                 </span>
//                 <div className="flex gap-2">
//                   <Button
//                     isIconOnly
//                     color="primary"
//                     variant="flat"
//                     onPress={() => {
//                       form.edit({ ...v, groupId: v.group?.id ?? "" });
//                     }}
//                   >
//                     <Pen className="size-4" />
//                   </Button>
//                   <Button
//                     isIconOnly
//                     color="danger"
//                     variant="flat"
//                     onPress={() => deletion.open(v.id)}
//                   >
//                     <Trash className="size-4" />
//                   </Button>
//                 </div>
//               </div>
//               <div className="grid gap-2 grid-cols-2 items-center ">
//                 <span className="">{v.phoneNumber}</span>
//                 <div className="flex gap-2">
//                   {[
//                     {
//                       src: "/whatsapp.svg",
//                       url: `https://wa.me/${v.phoneNumber}`,
//                     },
//                     {
//                       src: "/telegram.svg",
//                       url: `https://t.me/+${v.phoneNumber}`,
//                     },
//                   ].map(({ url, src }, i) => (
//                     <Button
//                       key={i + ""}
//                       isIconOnly
//                       color="primary"
//                       variant="flat"
//                       as={Link}
//                       href={url}
//                     >
//                       <Image
//                         alt=""
//                         src={src}
//                         width={1000}
//                         height={1000}
//                         className="size-4"
//                       />
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//               <div className="grid gap-2 grid-cols-2 ">
//                 <span className="">ግሩፕ</span>
//                 <span className="">{v.group?.name ?? "_-_-_-_-_-"}</span>
//               </div>
//               <div className="grid gap-2 grid-cols-2 ">
//                 <span className="">መምህር</span>
//                 <span className="">
//                   {v.group?.teacher?.firstName ?? "_-_-_-_-_-"}{" "}
//                   {v.group?.teacher?.fatherName ?? "_-_-_-_-_-"}{" "}
//                   {v.group?.teacher?.lastName ?? "_-_-_-_-_-"}
//                 </span>
//               </div>
//             </Button>
//           ))}
//         </ScrollShadow>
//       )}
//     </div>
//   );
// }
