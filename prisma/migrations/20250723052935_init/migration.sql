-- CreateEnum
CREATE TYPE "role" AS ENUM ('manager', 'scanner', 'controller', 'teacher', 'student', 'recordStudent', 'recordTeacher');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('Female', 'Male');

-- CreateEnum
CREATE TYPE "userStatus" AS ENUM ('new', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "attendanceName" AS ENUM ('morning', 'afternoon');

-- CreateEnum
CREATE TYPE "attendanceTimeName" AS ENUM ('morningScanStart', 'morningWorkStart', 'morningWorkEnd', 'afternoonScanStart', 'afternoonWorkStart', 'afternoonWorkEnd');

-- CreateEnum
CREATE TYPE "skipDateName" AS ENUM ('wholeDay', 'morning', 'afternoon');

-- CreateEnum
CREATE TYPE "progressStatus" AS ENUM ('sent', 'replayed');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "fatherName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "gender" "gender" NOT NULL DEFAULT 'Female',
    "age" INTEGER NOT NULL DEFAULT 0,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "chatId" TEXT NOT NULL DEFAULT '',
    "socket" TEXT NOT NULL DEFAULT '',
    "registerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "status" "userStatus" NOT NULL DEFAULT 'active',
    "controllerId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
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
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time" "attendanceName" NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendanceTime" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "name" "attendanceTimeName" NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "attendanceTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roomAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roomAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skipDate" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" "skipDateName" NOT NULL,

    CONSTRAINT "skipDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deduction" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "whole" DECIMAL(65,30) NOT NULL,
    "minute" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupTeacher" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "groupTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupStudent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "groupStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sentTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentMessageId" TEXT NOT NULL,
    "status" "progressStatus" NOT NULL DEFAULT 'sent',
    "replayedTime" TIMESTAMP(3),
    "replayedMessageId" TEXT,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "lastDate" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcementStudent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,

    CONSTRAINT "announcementStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "attendanceTime_year_month_name_key" ON "attendanceTime"("year", "month", "name");

-- CreateIndex
CREATE UNIQUE INDEX "deduction_year_month_key" ON "deduction"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "group_chatId_key" ON "group"("chatId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomAttendance" ADD CONSTRAINT "roomAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomAttendance" ADD CONSTRAINT "roomAttendance_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_toId_fkey" FOREIGN KEY ("toId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupTeacher" ADD CONSTRAINT "groupTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupTeacher" ADD CONSTRAINT "groupTeacher_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupStudent" ADD CONSTRAINT "groupStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupStudent" ADD CONSTRAINT "groupStudent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcementStudent" ADD CONSTRAINT "announcementStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcementStudent" ADD CONSTRAINT "announcementStudent_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
