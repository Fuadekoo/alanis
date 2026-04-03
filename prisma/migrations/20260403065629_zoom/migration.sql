-- CreateTable
CREATE TABLE "public"."zoomAttach" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoomUserId" TEXT NOT NULL,
    "zoomEmail" TEXT NOT NULL,
    "zoomDisplayName" TEXT,
    "zoomAccountType" TEXT DEFAULT 'personal',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zoomAttach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zoomAttach_zoomUserId_key" ON "public"."zoomAttach"("zoomUserId");

-- CreateIndex
CREATE UNIQUE INDEX "zoomAttach_userId_key" ON "public"."zoomAttach"("userId");

-- AddForeignKey
ALTER TABLE "public"."zoomAttach" ADD CONSTRAINT "zoomAttach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
