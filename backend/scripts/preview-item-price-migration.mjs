import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const databaseSchema = new URL(process.env.DATABASE_URL).searchParams.get('schema') ?? 'public';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseSchema)) {
    throw new Error('Unsupported database schema name');
  }
  const migrations = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at
    FROM "${databaseSchema}"."_prisma_migrations"
    WHERE migration_name = '3_rename_karma_value_to_price_vnd'
      AND finished_at IS NOT NULL AND rolled_back_at IS NULL
    ORDER BY finished_at DESC LIMIT 1
  `);
  if (migrations.length !== 1) {
    throw new Error('Completed migration 3 record is missing; classification must stop');
  }
  const cutoff = migrations[0].finished_at;
  const items = await prisma.item.findMany({
    select: {
      item_id: true, created_at: true, updated_at: true,
      price_vnd: true, karma_value: true, price_confirmed: true,
    },
    orderBy: { item_id: 'asc' },
  });
  const summary = { legacyUnconfirmed: 0, confirmedVnd: 0, restoredLowVnd: 0, unchanged: 0 };
  console.log(`Migration 3 finished at: ${cutoff.toISOString()}`);
  for (const item of items) {
    const legacy = item.created_at.getTime() < cutoff.getTime();
    const confirmedLegacy = legacy && item.price_confirmed
      && item.karma_value !== null && item.price_vnd !== item.karma_value
      && item.updated_at.getTime() > cutoff.getTime();
    const restoreVnd = !legacy && !item.price_confirmed
      && item.karma_value !== null && item.karma_value === item.price_vnd;
    const afterConfirmed = legacy ? confirmedLegacy : (restoreVnd || item.price_confirmed);
    const action = legacy && !confirmedLegacy ? 'unconfirm legacy'
      : restoreVnd ? 'restore VND' : 'unchanged';
    if (legacy && !confirmedLegacy) summary.legacyUnconfirmed++;
    else if (restoreVnd) summary.restoredLowVnd++;
    else summary.unchanged++;
    if (afterConfirmed) summary.confirmedVnd++;
    console.log(JSON.stringify({
      id: item.item_id, created_at: item.created_at.toISOString(), updated_at: item.updated_at.toISOString(),
      price_vnd: item.price_vnd, karma_value: item.karma_value,
      before_confirmed: item.price_confirmed,
      after_confirmed: afterConfirmed, action,
    }));
  }
  console.log('Summary:', summary);
} finally {
  await prisma.$disconnect();
}
