-- Migration 5: Rule-based legacy item price confirmation
-- Ensures that any legacy item across all environments whose price originated from karma points
-- is marked price_confirmed = false until explicitly updated with a real VND price by the owner.

-- Step 1: For any legacy items where karma_value was not preserved and price_vnd <= 1000 (old karma range),
-- copy price_vnd into karma_value
UPDATE "Item"
SET "karma_value" = "price_vnd"
WHERE "karma_value" IS NULL AND "price_vnd" <= 1000;

-- Step 2: Ensure any item with karma_value set and price_vnd matching karma_value or unconfirmed
-- is marked price_confirmed = false
UPDATE "Item"
SET "price_confirmed" = false
WHERE "karma_value" IS NOT NULL AND ("price_confirmed" IS NOT TRUE OR "price_vnd" = "karma_value");
