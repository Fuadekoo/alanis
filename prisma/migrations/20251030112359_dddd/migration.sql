-- DropForeignKey
ALTER TABLE "public"."DailyReport" DROP CONSTRAINT "DailyReport_activeTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DailyReport" DROP CONSTRAINT "DailyReport_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftTeacherData" DROP CONSTRAINT "ShiftTeacherData_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftTeacherData" DROP CONSTRAINT "ShiftTeacherData_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeacherProgress" DROP CONSTRAINT "TeacherProgress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeacherProgress" DROP CONSTRAINT "TeacherProgress_teacherId_fkey";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_activeTeacherId_fkey" FOREIGN KEY ("activeTeacherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
