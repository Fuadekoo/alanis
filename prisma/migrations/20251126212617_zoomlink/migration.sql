-- CreateTable
CREATE TABLE "public"."studyGroupLink" (
    "id" TEXT NOT NULL,
    "zoomLink" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studyGroupLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studyGroupLink_zoomLink_key" ON "public"."studyGroupLink"("zoomLink");
