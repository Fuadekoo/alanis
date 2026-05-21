/*
  Warnings:

  - You are about to drop the column `totalAmount` on the `TeacherSalary` table. All the data in the column will be lost.
  - Added the required column `totalSalary` to the `TeacherSalary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeacherSalary" DROP COLUMN "totalAmount",
ADD COLUMN     "totalSalary" DECIMAL(10,2) NOT NULL;
