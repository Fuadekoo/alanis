-- Add teacher salary link to the legacy teacherDailyReport table.
-- This migration was missing from disk but is still part of the migration history.

-- AlterTable
ALTER TABLE "public"."teacherDailyReport"
ADD COLUMN "teacherSalaryId" TEXT;

-- CreateIndex
CREATE INDEX "teacherDailyReport_teacherSalaryId_idx"
ON "public"."teacherDailyReport"("teacherSalaryId");

-- AddForeignKey
ALTER TABLE "public"."teacherDailyReport"
ADD CONSTRAINT "teacherDailyReport_teacherSalaryId_fkey"
FOREIGN KEY ("teacherSalaryId")
REFERENCES "public"."teacherSalary"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
