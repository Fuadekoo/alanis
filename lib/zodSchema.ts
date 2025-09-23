import z from "zod";

// login
export const loginSchema = z.object({
  username: z.string({}).nonempty("username is required").default(""),
  password: z.string({}).nonempty("password is required").default(""),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const passwordSchema = z.object({
  password: z.string().nonempty("password is required"),
  confirmPassword: z.string().nonempty("password didn't match"),
});
export type PasswordSchema = z.infer<typeof passwordSchema>;

export const usernameSchema = z.object({
  username: z.string().nonempty("username is required"),
});
export type UsernameSchema = z.infer<typeof usernameSchema>;

// common user

const commonSchema = z.object({
  id: z.string().optional().default(""),
  firstName: z.string().nonempty("first name is required").default(""),
  fatherName: z.string().default(""),
  lastName: z.string().default(""),
  gender: z
    .enum(["Female", "Male"], { message: "gender is required" })
    .default("Female"),
  age: z
    .string()
    .min(1, "must be greater or equal to zero")
    .regex(/^\d+$/, "must contain only digits")
    .default("0"),
  phoneNumber: z.string().default(""),
  country: z.string().default(""),
  username: z.string().nonempty("username is required").default(""),
  password: z.string().default(""),
});

// controller
export const controllerSchema = z.intersection(commonSchema, z.object({}));
export type ControllerSchema = z.infer<typeof controllerSchema>;

// teacher
export const teacherSchema = z.intersection(commonSchema, z.object({}));
export type TeacherSchema = z.infer<typeof teacherSchema>;

// student
export const studentSchema = z.intersection(
  commonSchema,
  z.object({
    startDate: z.string().default(""),
    controllerId: z.string().nonempty("controller is required"),
  })
);
export type StudentSchema = z.infer<typeof studentSchema>;

// room
export const roomSchema = z.object({
  id: z.string().optional().default(""),
  studentId: z.string().nonempty("student is required").default(""),
  teacherId: z.string().nonempty("teacher is required").default(""),
  time: z
    .string()
    .nonempty("time is required")
    .default(new Date().toTimeString().slice(0, 6) + "00"),
  duration: z.string().regex(/^\d+$/, "must be number").default(""),
});
export type RoomSchema = z.infer<typeof roomSchema>;

// link
export const linkSchema = z.object({
  id: z.string().nonempty("room is required"),
  link: z
    .string()
    .nonempty("link is required")
    .startsWith("https://", "link must be copied from web or mobile app"),
});
export type LinkSchema = z.infer<typeof linkSchema>;

// filter
export const filterSchema = z.object({
  search: z.string(),
  currentPage: z.coerce.number().positive(""),
  row: z.coerce.number().positive(""),
  sort: z.coerce.boolean(),
});
export type FilterSchema = z.infer<typeof filterSchema>;

// attendanceSetting
export const attendanceSetting = z.object({
  year: z.coerce.number({}).min(2025).default(2025),
  month: z.coerce.number({}).min(0).max(11).default(0),
  whole: z.coerce
    .number({ message: "must be number" })
    .min(0, "must be grater than 0")
    .default(0),
  minute: z.coerce
    .number({ message: "must be number" })
    .min(0, "must be grater than 0")
    .default(0),
  morningScanStart: z
    .string({})
    .nonempty("required")
    .default(new Date().toTimeString().slice(0, 5)),
  morningWorkStart: z
    .string({})
    .nonempty("required")
    .default(new Date().toTimeString().slice(0, 5)),
  morningWorkEnd: z
    .string({})
    .nonempty("required")
    .default(new Date().toTimeString().slice(0, 5)),
  afternoonScanStart: z
    .string({})
    .nonempty("required")
    .default(new Date().toTimeString().slice(0, 5)),
  afternoonWorkStart: z
    .string({})
    .nonempty("required")
    .default(new Date().toTimeString().slice(0, 5)),
  afternoonWorkEnd: z
    .string({})
    .nonempty("required")
    .default(new Date().toTimeString().slice(0, 5)),
});
export type AttendanceSetting = z.infer<typeof attendanceSetting>;

export const registerSchema = z.object({
  name: z.string().nonempty("name is required").default(""),
  country: z.string().nonempty("name is required").default(""),
  phoneNumber: z.string().regex(/^\d+$/, "must be number").default(""),
});
export type RegisterSchema = z.infer<typeof registerSchema>;

export const assignControllerSchema = z.object({
  controllerId: z.string().nonempty("select controller"),
  id: z.string().nonempty("select student"),
});
export type AssignControllerSchema = z.infer<typeof assignControllerSchema>;

export const studentRecordSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().nonempty("first name is required").default(""),
  fatherName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().regex(/^\d{12}$/, "must be 12 digit number"),
  groupId: z.string().nonempty("group is required"),
  username: z.string().nonempty("group is required"),
  password: z.string().optional(),
});

export type StudentRecordSchema = z.infer<typeof studentRecordSchema>;

export const announcementSchema = z.object({
  id: z.string().optional(),
  forUser: z.array(z.string().nonempty("student is required")).default([]),
  text: z.string().nonempty("announcement is required").default(""),
  lastDate: z.coerce.date({ message: "must be date format" }).optional(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const depositSchema = z.object({
  studentId: z.string().nonempty("student is required").default(""),
  amount: z.coerce.number().positive("amount must be positive"),
  photo: z.string().nonempty("photo is required").default(""),
});
export type DepositSchema = z.infer<typeof depositSchema>;

export const paymentSchema = z.object({
  studentId: z.string().nonempty("student is required"),
  perMonthAmount: z.coerce.number().positive("amount must be positive"),
  year: z.coerce.number().int().min(2000, "year must be valid"),
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12, "month must be between 1 and 12"),
});
export type PaymentSchema = z.infer<typeof paymentSchema>;
