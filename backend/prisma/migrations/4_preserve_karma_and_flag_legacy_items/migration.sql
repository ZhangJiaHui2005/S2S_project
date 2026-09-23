-- AlterTable
ALTER TABLE "Item" ADD COLUMN "karma_value" INTEGER;
ALTER TABLE "Item" ADD COLUMN "price_confirmed" BOOLEAN NOT NULL DEFAULT true;

-- Preserve original karma values from price_vnd for legacy items
UPDATE "Item" SET "karma_value" = "price_vnd" WHERE "item_id" IN (4, 5, 11);

-- Flag legacy items whose price in VND has not been confirmed by user
UPDATE "Item" SET "price_confirmed" = false WHERE "item_id" IN (4, 5, 11);

-- CreateIndex
CREATE INDEX "Item_price_confirmed_idx" ON "Item"("price_confirmed");
