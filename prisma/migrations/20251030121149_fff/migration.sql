/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
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

-- DropTable
DROP TABLE "public"."User";

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_activeTeacherId_fkey" FOREIGN KEY ("activeTeacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
