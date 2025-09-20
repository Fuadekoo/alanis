/*
  Migration to add PaymentGroup model and migrate existing payment data.
  This migration will:
  1. Create the paymentGroup table
  2. Migrate existing payment records to use payment groups
  3. Update the payment table structure
*/

-- Create the paymentGroup table first
CREATE TABLE "paymentGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "paymentStatus" NOT NULL DEFAULT 'paid',
    "img" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paymentGroup_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for paymentGroup
ALTER TABLE "paymentGroup" ADD CONSTRAINT "paymentGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing payment data by creating payment groups for each existing payment
INSERT INTO "paymentGroup" ("id", "userId", "status", "img", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "userId",
    "status",
    "img",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "payment";

-- Add the paymentGroupId column to payment table (nullable first)
ALTER TABLE "payment" ADD COLUMN "paymentGroupId" TEXT;

-- Update existing payment records to reference the appropriate payment group
WITH payment_groups AS (
    SELECT 
        pg.id as group_id,
        pg."userId",
        pg."img",
        pg."status",
        ROW_NUMBER() OVER (PARTITION BY pg."userId", pg."img", pg."status" ORDER BY pg."createdAt") as rn
    FROM "paymentGroup" pg
),
existing_payments AS (
    SELECT 
        p.id,
        p."userId",
        p."img",
        p."status",
        ROW_NUMBER() OVER (PARTITION BY p."userId", p."img", p."status" ORDER BY p.id) as rn
    FROM "payment" p
)
UPDATE "payment" 
SET "paymentGroupId" = pg.group_id
FROM payment_groups pg, existing_payments ep
WHERE "payment".id = ep.id 
  AND pg."userId" = ep."userId" 
  AND pg."img" = ep."img" 
  AND pg."status" = ep."status"
  AND pg.rn = ep.rn;

-- Make paymentGroupId NOT NULL
ALTER TABLE "payment" ALTER COLUMN "paymentGroupId" SET NOT NULL;

-- Drop old columns from payment table
ALTER TABLE "payment" DROP CONSTRAINT "payment_userId_fkey";
ALTER TABLE "payment" DROP COLUMN "img";
ALTER TABLE "payment" DROP COLUMN "status";
ALTER TABLE "payment" DROP COLUMN "userId";

-- Add createdAt column to payment
ALTER TABLE "payment" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create unique constraint on payment table
CREATE UNIQUE INDEX "payment_paymentGroupId_year_month_key" ON "payment"("paymentGroupId", "year", "month");

-- Add foreign key constraint for payment -> paymentGroup
ALTER TABLE "payment" ADD CONSTRAINT "payment_paymentGroupId_fkey" FOREIGN KEY ("paymentGroupId") REFERENCES "paymentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
