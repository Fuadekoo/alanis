/*
  Warnings:

  - You are about to drop the column `totalSalary` on the `TeacherSalary` table. All the data in the column will be lost.
  - Added the required column `totalAmount` to the `TeacherSalary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeacherSalary" DROP COLUMN "totalSalary",
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL;
