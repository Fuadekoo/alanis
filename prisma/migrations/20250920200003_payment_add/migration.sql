-- CreateEnum
CREATE TYPE "public"."paymentStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "balance" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."deposit" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "controllerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "photo" TEXT NOT NULL,
    "status" "public"."paymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "perMonthAmount" DECIMAL(65,30) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_studentId_year_month_key" ON "public"."payment"("studentId", "year", "month");

-- AddForeignKey
ALTER TABLE "public"."deposit" ADD CONSTRAINT "deposit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposit" ADD CONSTRAINT "deposit_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
