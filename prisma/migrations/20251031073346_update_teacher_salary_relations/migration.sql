-- AlterTable
ALTER TABLE "public"."ShiftTeacherData" ADD COLUMN     "teacherSalaryId" TEXT;

-- AlterTable
ALTER TABLE "public"."TeacherProgress" ADD COLUMN     "teacherSalaryId" TEXT;

-- CreateTable
CREATE TABLE "public"."teacherSalary" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."paymentStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "teacherSalary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_teacherSalaryId_fkey" FOREIGN KEY ("teacherSalaryId") REFERENCES "public"."teacherSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_teacherSalaryId_fkey" FOREIGN KEY ("teacherSalaryId") REFERENCES "public"."teacherSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacherSalary" ADD CONSTRAINT "teacherSalary_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
