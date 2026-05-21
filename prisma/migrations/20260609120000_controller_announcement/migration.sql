-- CreateTable
CREATE TABLE "public"."controllerAnnouncementData" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "lastDate" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controllerAnnouncementData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcementController" (
    "id" TEXT NOT NULL,
    "controllerId" TEXT NOT NULL,
    "controllerAnnouncementDataId" TEXT NOT NULL,

    CONSTRAINT "announcementController_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."announcementController" ADD CONSTRAINT "announcementController_controllerId_fkey" FOREIGN KEY ("controllerId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcementController" ADD CONSTRAINT "announcementController_controllerAnnouncementDataId_fkey" FOREIGN KEY ("controllerAnnouncementDataId") REFERENCES "public"."controllerAnnouncementData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
