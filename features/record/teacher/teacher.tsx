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
//   Select,
//   SelectItem,
//   Skeleton,
// } from "@/components/ui/heroui";
// import { useState } from "react";
// import { List } from "./list";
// import { Detail } from "./detail";
// import { UseRegistration, useRegistration } from "@/hooks/useRegistration";
// import { deleteTeacher, getTeachers, registerTeacher } from "./actions";
// import useData from "@/hooks/useData";
// import { getGroups } from "../student/action";
// import useDelete, { UseDelete } from "@/hooks/useDelete";
// import { teacherSchema } from "./schema";

// export function RecordTeacher() {
//   const [search, setSearch] = useState("");
//   const [teacherData, isLoading, refresh] = useData(
//     getTeachers,
//     (data) => {
//       const value = data.find((v) => v.id == selected)?.id ?? data[0]?.id;
//       if (value) {
//         setSelected(value);
//       }
//     },
//     search
//   );
//   const [selected, setSelected] = useState("");
//   const form = useRegistration(registerTeacher, teacherSchema, (state) => {
//     if (state.status) {
//       refresh();
//     }
//   });
//   const deletion = useDelete(deleteTeacher, (state) => {
//     if (state.status) {
//       refresh();
//     }
//   });

//   return (
//     <div className="relative p-2 md:p-5 grid md:grid-cols-2 gap-5 overflow-hidden ">
//       <List
//         {...{
//           search,
//           setSearch,
//           teacherData,
//           isLoading,
//           selected,
//           setSelected,
//           form,
//           deletion,
//         }}
//       />
//       <Detail selected={selected} />
//       <Registration form={form} />
//       <Deletion deletion={deletion} />
//     </div>
//   );
// }

// function Registration({
//   form,
// }: {
//   form: UseRegistration<typeof registerTeacher>;
// }) {
//   const [groups] = useData(getGroups, () => {});

//   return (
//     <CModal isOpen={form.isOpen} onOpenChange={form.onOpenChange}>
//       <Form onSubmit={form.onSubmit} validationErrors={form.validationErrors}>
//         <ModalContent>
//           {!groups ? (
//             <Skeleton className="" />
//           ) : (
//             (onClose) => (
//               <>
//                 <ModalHeader>Teacher Registration</ModalHeader>
//                 <ModalBody className="grid gap-2 md:grid-cols-3">
//                   <Input
//                     label="First Name"
//                     labelPlacement="outside"
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
//                   <Select
//                     label="Group"
//                     labelPlacement="outside"
//                     {...form.register("groupId")}
//                   >
//                     {groups.map((v) => (
//                       <SelectItem key={v.id}>{v.name}</SelectItem>
//                     ))}
//                   </Select>
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
//                 </ModalBody>
//                 <ModalFooter>
//                   <Button variant="flat" onPress={onClose}>
//                     Back
//                   </Button>
//                   <Button
//                     color="primary"
//                     type="submit"
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

// function Deletion({ deletion }: { deletion: UseDelete }) {
//   return (
//     <CModal isOpen={deletion.isOpen} onOpenChange={deletion.close}>
//       <ModalContent>
//         {(onClose) => (
//           <>
//             <ModalHeader>Teacher Deletion</ModalHeader>
//             <ModalBody className="">
//               <p className="">
//                 Are you sure, do you want to{" "}
//                 <span className="text-danger">delete</span> teacher
//               </p>
//             </ModalBody>
//             <ModalFooter>
//               <Button variant="flat" onPress={onClose}>
//                 Back
//               </Button>
//               <Button
//                 color="danger"
//                 onPress={deletion.handle}
//                 isLoading={deletion.isLoading}
//               >
//                 Delete
//               </Button>
//             </ModalFooter>
//           </>
//         )}
//       </ModalContent>
//     </CModal>
//   );
// }
