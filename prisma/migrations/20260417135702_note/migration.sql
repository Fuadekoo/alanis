/*
  Warnings:

  - You are about to drop the column `notes` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "notes",
ADD COLUMN     "profileNotes" TEXT;

-- CreateTable
CREATE TABLE "public"."notes" (
    "id" TEXT NOT NULL,
    "writentoId" TEXT NOT NULL,
    "writenbyId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_writentoId_fkey" FOREIGN KEY ("writentoId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_writenbyId_fkey" FOREIGN KEY ("writenbyId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
