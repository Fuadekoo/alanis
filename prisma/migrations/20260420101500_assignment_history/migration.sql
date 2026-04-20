-- CreateTable
CREATE TABLE "teacher_assignment_history" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detachedAt" TIMESTAMP(3),
    "time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controller_assignment_history" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "controllerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controller_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_assignment_history_studentId_detachedAt_idx" ON "teacher_assignment_history"("studentId", "detachedAt");

-- CreateIndex
CREATE INDEX "teacher_assignment_history_teacherId_detachedAt_idx" ON "teacher_assignment_history"("teacherId", "detachedAt");

-- CreateIndex
CREATE INDEX "controller_assignment_history_studentId_detachedAt_idx" ON "controller_assignment_history"("studentId", "detachedAt");

-- CreateIndex
CREATE INDEX "controller_assignment_history_controllerId_detachedAt_idx" ON "controller_assignment_history"("controllerId", "detachedAt");

-- AddForeignKey
ALTER TABLE "teacher_assignment_history" ADD CONSTRAINT "teacher_assignment_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment_history" ADD CONSTRAINT "teacher_assignment_history_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controller_assignment_history" ADD CONSTRAINT "controller_assignment_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controller_assignment_history" ADD CONSTRAINT "controller_assignment_history_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
