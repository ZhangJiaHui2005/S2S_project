-- The column rename in migration 3 is the boundary for writes using price_vnd.
-- A missing successful migration record is ambiguous: fail rather than guess a date.

DO $$
DECLARE
  conversion_finished_at TIMESTAMPTZ;
BEGIN
  SELECT finished_at INTO conversion_finished_at
  FROM "_prisma_migrations"
  WHERE migration_name = '3_rename_karma_value_to_price_vnd'
    AND finished_at IS NOT NULL
    AND rolled_back_at IS NULL
  ORDER BY finished_at DESC
  LIMIT 1;

  IF conversion_finished_at IS NULL THEN
    RAISE EXCEPTION 'Cannot classify Item prices: completed migration 3 record is missing';
  END IF;

  -- Item.created_at is a timestamp without time zone, stored by Prisma in UTC.
  -- Preserve already confirmed legacy prices when the current VND amount differs
  -- from the stored original karma amount and the edit happened after conversion.
  UPDATE "Item"
  SET karma_value = COALESCE(karma_value, price_vnd),
      price_confirmed = false
  WHERE created_at < (conversion_finished_at AT TIME ZONE 'UTC')
    AND NOT (
      price_confirmed = true
      AND karma_value IS NOT NULL
      AND price_vnd <> karma_value
      AND updated_at > (conversion_finished_at AT TIME ZONE 'UTC')
    );

  -- Migration 5 copied genuine low VND prices into karma_value and marked them
  -- unconfirmed. Items created after the column rename used the VND field, so
  -- undo precisely that pollution without relying on an amount threshold or ID.
  UPDATE "Item"
  SET karma_value = NULL,
      price_confirmed = true
  WHERE created_at >= (conversion_finished_at AT TIME ZONE 'UTC')
    AND price_confirmed = false
    AND karma_value = price_vnd;
END $$;
