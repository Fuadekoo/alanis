ALTER TABLE "user"
ADD COLUMN "pendingControllerId" TEXT;

CREATE INDEX "user_pendingControllerId_idx" ON "user"("pendingControllerId");

ALTER TABLE "user"
ADD CONSTRAINT "user_pendingControllerId_fkey"
FOREIGN KEY ("pendingControllerId") REFERENCES "user"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
