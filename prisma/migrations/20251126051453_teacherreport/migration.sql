-- CreateTable
CREATE TABLE "public"."teacherDailyReport" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "learningProgress" TEXT NOT NULL,
    "approved" BOOLEAN,

    CONSTRAINT "teacherDailyReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."teacherDailyReport" ADD CONSTRAINT "teacherDailyReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacherDailyReport" ADD CONSTRAINT "teacherDailyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
