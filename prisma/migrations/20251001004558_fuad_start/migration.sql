-- CreateEnum
CREATE TYPE "public"."role" AS ENUM ('manager', 'scanner', 'controller', 'teacher', 'student', 'recordStudent', 'recordTeacher');

-- CreateEnum
CREATE TYPE "public"."gender" AS ENUM ('Female', 'Male');

-- CreateEnum
CREATE TYPE "public"."userStatus" AS ENUM ('new', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "public"."paymentStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."attendanceName" AS ENUM ('morning', 'afternoon');

-- CreateEnum
CREATE TYPE "public"."attendanceTimeName" AS ENUM ('morningScanStart', 'morningWorkStart', 'morningWorkEnd', 'afternoonScanStart', 'afternoonWorkStart', 'afternoonWorkEnd');

-- CreateEnum
CREATE TYPE "public"."skipDateName" AS ENUM ('wholeDay', 'morning', 'afternoon');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "role" "public"."role" NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "fatherName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "gender" "public"."gender" NOT NULL DEFAULT 'Female',
    "age" INTEGER NOT NULL DEFAULT 0,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT NOT NULL DEFAULT '',
    "chatId" TEXT NOT NULL DEFAULT '',
    "socket" TEXT NOT NULL DEFAULT '',
    "registerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "status" "public"."userStatus" NOT NULL DEFAULT 'active',
    "controllerId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "link" TEXT NOT NULL DEFAULT '',
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deposit" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "controllerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "photo" TEXT NOT NULL,
    "status" "public"."paymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "perMonthAmount" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time" "public"."attendanceName" NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendanceTime" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "name" "public"."attendanceTimeName" NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "attendanceTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roomAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roomAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skipDate" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" "public"."skipDateName" NOT NULL,

    CONSTRAINT "skipDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deduction" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "whole" DECIMAL(65,30) NOT NULL,
    "minute" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "lastDate" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcementStudent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,

    CONSTRAINT "announcementStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "payment_studentId_year_month_key" ON "public"."payment"("studentId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "attendanceTime_year_month_name_key" ON "public"."attendanceTime"("year", "month", "name");

-- CreateIndex
CREATE UNIQUE INDEX "deduction_year_month_key" ON "public"."deduction"("year", "month");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room" ADD CONSTRAINT "room_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room" ADD CONSTRAINT "room_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposit" ADD CONSTRAINT "deposit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposit" ADD CONSTRAINT "deposit_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance" ADD CONSTRAINT "attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."roomAttendance" ADD CONSTRAINT "roomAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."roomAttendance" ADD CONSTRAINT "roomAttendance_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "chat_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "chat_toId_fkey" FOREIGN KEY ("toId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcementStudent" ADD CONSTRAINT "announcementStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcementStudent" ADD CONSTRAINT "announcementStudent_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
