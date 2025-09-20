// import z from "zod";

// export const teacherSchema = z.object({
//   id: z.string().optional().default(""),
//   firstName: z.string().nonempty("first name is required").default(""),
//   fatherName: z.string().optional().default(""),
//   lastName: z.string().optional().default(""),
//   phoneNumber: z
//     .string()
//     .regex(/^\d{12}$/, "must be 12 digit")
//     .default(""),
//   username: z.string().nonempty("username is required").default(""),
//   password: z.string().optional().default(""),
//   groupId: z.string().nonempty("group is required").default(""),
// });

// export type TeacherSchema = z.infer<typeof teacherSchema>;

// export const assignSchema = z.object({
//   teacherId: z.string().nonempty("teacher is required"),
//   studentId: z.string().nonempty("student is required"),
// });

// export type AssignSchema = z.infer<typeof assignSchema>;
