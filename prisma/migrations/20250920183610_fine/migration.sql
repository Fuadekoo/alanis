/*
  Warnings:

  - You are about to drop the `group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groupStudent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groupTeacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paymentGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `progress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."groupStudent" DROP CONSTRAINT "groupStudent_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."groupStudent" DROP CONSTRAINT "groupStudent_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."groupTeacher" DROP CONSTRAINT "groupTeacher_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."groupTeacher" DROP CONSTRAINT "groupTeacher_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payment" DROP CONSTRAINT "payment_paymentGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."paymentGroup" DROP CONSTRAINT "paymentGroup_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."progress" DROP CONSTRAINT "progress_studentId_fkey";

-- DropTable
DROP TABLE "public"."group";

-- DropTable
DROP TABLE "public"."groupStudent";

-- DropTable
DROP TABLE "public"."groupTeacher";

-- DropTable
DROP TABLE "public"."payment";

-- DropTable
DROP TABLE "public"."paymentGroup";

-- DropTable
DROP TABLE "public"."progress";

-- DropEnum
DROP TYPE "public"."paymentStatus";

-- DropEnum
DROP TYPE "public"."progressStatus";
