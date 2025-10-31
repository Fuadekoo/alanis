/*
  Warnings:

  - Added the required column `totalCount` to the `ShiftTeacherData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDayForLearning` to the `teacherSalary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DailyReport" ADD COLUMN     "studentApproved" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."ShiftTeacherData" ADD COLUMN     "totalCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."TeacherProgress" ADD COLUMN     "totalCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."teacherSalary" ADD COLUMN     "totalDayForLearning" INTEGER NOT NULL;
