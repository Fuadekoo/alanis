/*
  Warnings:

  - Added the required column `unitPrice` to the `teacherSalary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."teacherSalary" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "unitPrice" INTEGER NOT NULL;
