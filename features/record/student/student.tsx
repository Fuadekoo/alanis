// "use client";

// import {
//   Button,
//   CModal,
//   Form,
//   Input,
//   ModalBody,
//   ModalContent,
//   ModalFooter,
//   ModalHeader,
//   SelectItem,
// } from "@/components/ui/heroui";
// import React, { useState } from "react";
// import {
//   deleteStudent,
//   getGroups,
//   getStudents,
//   registerStudent,
// } from "./action";
// import { List } from "./list";
// import { Detail } from "./detail";
// import { Select } from "@heroui/react";
// import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
// import { studentRecordSchema } from "@/lib/zodSchema";
// import useData from "@/hooks/useData";
// import Loading from "@/components/loading";
// import useDelete, { UseDelete } from "@/hooks/useDelete";

// type Student = Awaited<ReturnType<typeof getStudents>>[0];

// export function RecordStudent() {
//   const [search, setSearch] = useState("");
//   const [data, isLoading, refresh] = useData(
//     getStudents,
//     (data) => {
//       const value = data.find((v) => v.id == selected?.id) ?? data[0];
//       if (value) {
//         setSelected(value);
//       }
//     },
//     search
//   );
//   const [selected, setSelected] = useState<Student>();
//   const form = useRegistration(
//     registerStudent,
//     studentRecordSchema,
//     (state) => {
//       if (state) {
//         refresh();
//       }
//     }
//   );
//   const deletion = useDelete(deleteStudent, (state) => {
//     if (state.status) {
//       refresh();
//     }
//   });

//   return (
//     <div className="p-2 md:p-5 grid gap-5 md:grid-cols-2 overflow-hidden ">
//       <List
//         {...{
//           search,
//           setSearch,
//           data,
//           isLoading,
//           selected,
//           setSelected,
//           form,
//           deletion,
//         }}
//       />
//       <Detail {...{ selected }} />
//       <Registration form={form} />
//       <Deletion deletion={deletion} />
//     </div>
//   );
// }

// function Registration({
//   form,
// }: {
//   form: UseRegistration<typeof registerStudent>;
// }) {
//   const [groups] = useData(getGroups, () => {});

//   return (
//     <CModal size="lg" isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
//       <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
//         <ModalContent className="w-fit">
//           {!groups ? (
//             <Loading className="size-4 " />
//           ) : (
//             (onClose) => (
//               <>
//                 <ModalHeader>
//                   <p className="">Registration</p>
//                 </ModalHeader>
//                 <ModalBody className="grid md:grid-cols-2 xl:grid-cols-3">
//                   <Input
//                     label="First Name"
//                     labelPlacement="outside"
//                     className=" "
//                     {...form.register("firstName")}
//                   />
//                   <Input
//                     label="Father Name"
//                     labelPlacement="outside"
//                     {...form.register("fatherName")}
//                   />
//                   <Input
//                     label="Last Name"
//                     labelPlacement="outside"
//                     {...form.register("lastName")}
//                   />
//                   <Input
//                     label="Phone Number"
//                     labelPlacement="outside"
//                     {...form.register("phoneNumber")}
//                   />
//                   <Input
//                     label="Username"
//                     labelPlacement="outside"
//                     {...form.register("username")}
//                   />
//                   <Input
//                     label="Password"
//                     labelPlacement="outside"
//                     {...form.register("password")}
//                   />
//                   <Select
//                     label="Group"
//                     labelPlacement="outside"
//                     {...form.register("groupId")}
//                   >
//                     {groups.map(({ id, name }) => (
//                       <SelectItem key={id}>{name}</SelectItem>
//                     ))}
//                   </Select>
//                   {/* <p className="">{JSON.stringify(form.validationErrors)}</p> */}
//                 </ModalBody>
//                 <ModalFooter>
//                   <Button variant="flat" onPress={onClose}>
//                     Back
//                   </Button>
//                   <Button
//                     type="submit"
//                     color="primary"
//                     isLoading={form.isLoading}
//                   >
//                     Submit
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

// function Deletion({
//   deletion: { isOpen, close, isLoading, handle },
// }: {
//   deletion: UseDelete;
// }) {
//   return (
//     <CModal isOpen={isOpen} onOpenChange={(v) => !v && close()}>
//       <ModalContent>
//         {(onClose) => (
//           <>
//             <ModalHeader className="font-semibold text-danger-600">
//               Student Deletion
//             </ModalHeader>
//             <ModalBody>
//               <p className="">
//                 Are you sure, do you want to{" "}
//                 <span className="text-danger-600">delete</span> student?
//               </p>
//             </ModalBody>
//             <ModalFooter>
//               <Button variant="flat" onPress={onClose}>
//                 Back
//               </Button>
//               <Button color="danger" isLoading={isLoading} onPress={handle}>
//                 Delete
//               </Button>
//             </ModalFooter>
//           </>
//         )}
//       </ModalContent>
//     </CModal>
//   );
// }
