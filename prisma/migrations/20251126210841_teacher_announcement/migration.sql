-- CreateTable
CREATE TABLE "public"."teacherAnnouncementData" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "lastDate" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacherAnnouncementData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcementTeacher" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "teacherAnnouncementDataId" TEXT NOT NULL,

    CONSTRAINT "announcementTeacher_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."announcementTeacher" ADD CONSTRAINT "announcementTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcementTeacher" ADD CONSTRAINT "announcementTeacher_teacherAnnouncementDataId_fkey" FOREIGN KEY ("teacherAnnouncementDataId") REFERENCES "public"."teacherAnnouncementData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
