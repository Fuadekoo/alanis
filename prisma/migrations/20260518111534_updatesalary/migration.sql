/*
  Warnings:

  - You are about to drop the `DailyReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShiftTeacherData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeacherProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacherDailyReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacherSalary` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TeacherStudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'PERMISSION');

-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "DailyReport" DROP CONSTRAINT "DailyReport_activeTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "DailyReport" DROP CONSTRAINT "DailyReport_shiftTeacherDataId_fkey";

-- DropForeignKey
ALTER TABLE "DailyReport" DROP CONSTRAINT "DailyReport_studentId_fkey";

-- DropForeignKey
ALTER TABLE "DailyReport" DROP CONSTRAINT "DailyReport_teacherProgressId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftTeacherData" DROP CONSTRAINT "ShiftTeacherData_originalProgressId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftTeacherData" DROP CONSTRAINT "ShiftTeacherData_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftTeacherData" DROP CONSTRAINT "ShiftTeacherData_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftTeacherData" DROP CONSTRAINT "ShiftTeacherData_teacherSalaryId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProgress" DROP CONSTRAINT "TeacherProgress_studentId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProgress" DROP CONSTRAINT "TeacherProgress_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TeacherProgress" DROP CONSTRAINT "TeacherProgress_teacherSalaryId_fkey";

-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_teacherSalaryId_fkey";

-- DropForeignKey
ALTER TABLE "teacherDailyReport" DROP CONSTRAINT "teacherDailyReport_studentId_fkey";

-- DropForeignKey
ALTER TABLE "teacherDailyReport" DROP CONSTRAINT "teacherDailyReport_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "teacherDailyReport" DROP CONSTRAINT "teacherDailyReport_teacherSalaryId_fkey";

-- DropForeignKey
ALTER TABLE "teacherSalary" DROP CONSTRAINT "teacherSalary_teacherId_fkey";

-- DropIndex
DROP INDEX "user_pendingControllerId_idx";

-- DropTable
DROP TABLE "DailyReport";

-- DropTable
DROP TABLE "ShiftTeacherData";

-- DropTable
DROP TABLE "TeacherProgress";

-- DropTable
DROP TABLE "teacherDailyReport";

-- DropTable
DROP TABLE "teacherSalary";

-- DropEnum
DROP TYPE "progressStatus";

-- CreateTable
CREATE TABLE "TeacherStudent" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "TeacherStudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherDailyReport" (
    "id" TEXT NOT NULL,
    "combId" TEXT NOT NULL,
    "salaryId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherDailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSalary" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "totalSalary" DECIMAL(10,2) NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
    "paymentPhoto" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSalary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherStudent_teacherId_idx" ON "TeacherStudent"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherStudent_studentId_idx" ON "TeacherStudent"("studentId");

-- CreateIndex
CREATE INDEX "TeacherStudent_active_status_idx" ON "TeacherStudent"("active", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherStudent_teacherId_studentId_key" ON "TeacherStudent"("teacherId", "studentId");

-- CreateIndex
CREATE INDEX "TeacherDailyReport_combId_idx" ON "TeacherDailyReport"("combId");

-- CreateIndex
CREATE INDEX "TeacherDailyReport_salaryId_idx" ON "TeacherDailyReport"("salaryId");

-- CreateIndex
CREATE INDEX "TeacherDailyReport_date_idx" ON "TeacherDailyReport"("date");

-- CreateIndex
CREATE INDEX "TeacherDailyReport_attendance_date_idx" ON "TeacherDailyReport"("attendance", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherDailyReport_combId_date_key" ON "TeacherDailyReport"("combId", "date");

-- CreateIndex
CREATE INDEX "TeacherSalary_teacherId_idx" ON "TeacherSalary"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherSalary_month_year_idx" ON "TeacherSalary"("month", "year");

-- CreateIndex
CREATE INDEX "TeacherSalary_status_idx" ON "TeacherSalary"("status");

-- CreateIndex
CREATE INDEX "TeacherSalary_year_month_status_idx" ON "TeacherSalary"("year", "month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSalary_teacherId_month_year_key" ON "TeacherSalary"("teacherId", "month", "year");

-- AddForeignKey
ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherDailyReport" ADD CONSTRAINT "TeacherDailyReport_combId_fkey" FOREIGN KEY ("combId") REFERENCES "TeacherStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherDailyReport" ADD CONSTRAINT "TeacherDailyReport_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "TeacherSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSalary" ADD CONSTRAINT "TeacherSalary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_teacherSalaryId_fkey" FOREIGN KEY ("teacherSalaryId") REFERENCES "TeacherSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
