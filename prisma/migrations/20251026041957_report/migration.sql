-- CreateEnum
CREATE TYPE "public"."progressStatus" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "public"."DailyReport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activeTeacherId" TEXT NOT NULL,
    "teacherProgressId" TEXT,
    "shiftTeacherDataId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "learningSlot" TEXT NOT NULL,
    "learningProgress" TEXT NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherProgress" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "learningCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "progressStatus" "public"."progressStatus" NOT NULL DEFAULT 'open',
    "paymentStatus" "public"."paymentStatus" NOT NULL DEFAULT 'pending',
    "learningSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShiftTeacherData" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "learningCount" INTEGER NOT NULL,
    "missingCount" INTEGER NOT NULL,
    "progressStatus" "public"."progressStatus" NOT NULL,
    "paymentStatus" "public"."paymentStatus" NOT NULL DEFAULT 'pending',
    "learningSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalProgressId" TEXT,

    CONSTRAINT "ShiftTeacherData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTeacherData_originalProgressId_key" ON "public"."ShiftTeacherData"("originalProgressId");

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_activeTeacherId_fkey" FOREIGN KEY ("activeTeacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_teacherProgressId_fkey" FOREIGN KEY ("teacherProgressId") REFERENCES "public"."TeacherProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyReport" ADD CONSTRAINT "DailyReport_shiftTeacherDataId_fkey" FOREIGN KEY ("shiftTeacherDataId") REFERENCES "public"."ShiftTeacherData"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherProgress" ADD CONSTRAINT "TeacherProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftTeacherData" ADD CONSTRAINT "ShiftTeacherData_originalProgressId_fkey" FOREIGN KEY ("originalProgressId") REFERENCES "public"."TeacherProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
