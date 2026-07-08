-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('OPEN', 'SOLVED', 'UNSOLVED');

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "reportedToManager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolutionNote" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "status" "NoteStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "BankAccountName" TEXT DEFAULT '',
ADD COLUMN     "BankAccountNumber" TEXT DEFAULT '';
