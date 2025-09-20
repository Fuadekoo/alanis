/*
  Warnings:

  - Added the required column `status` to the `payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "paymentStatus" AS ENUM ('paid', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "status" "paymentStatus" NOT NULL;
