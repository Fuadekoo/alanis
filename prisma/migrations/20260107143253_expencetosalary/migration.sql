-- AlterTable
ALTER TABLE "public"."expense" ADD COLUMN     "paymentPhoto" TEXT,
ADD COLUMN     "status" "public"."paymentStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "teacherSalaryId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."expense" ADD CONSTRAINT "expense_teacherSalaryId_fkey" FOREIGN KEY ("teacherSalaryId") REFERENCES "public"."teacherSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
