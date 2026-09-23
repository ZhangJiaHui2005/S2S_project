import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const schema = `s2s_mig_test_${randomBytes(8).toString('hex')}`;
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('schema', schema);
const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  MIGRATION_TEST_SCHEMA: schema,
  BETTER_AUTH_SECRET: randomBytes(48).toString('hex'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  BETTER_AUTH_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
};
const adminDb = new PrismaClient();
let testDb;
let schemaCreated = false;

function run(binary, args, expectFailure = false) {
  const result = spawnSync(binary, args, { env, stdio: 'pipe', encoding: 'utf8' });
  if (expectFailure) {
    if (result.status === 0 || !`${result.stderr}\n${result.stdout}`.includes('completed migration 3 record is missing')) {
      throw new Error(`Expected safe migration failure; got ${result.status}: ${result.stderr}`);
    }
    return;
  }
  if (result.status !== 0) {
    throw new Error(`${binary} ${args.join(' ')} failed (${result.status}): ${result.stderr}\n${result.stdout}`);
  }
  if (result.stdout) process.stdout.write(result.stdout);
}

function migration(number, name) {
  run('./node_modules/.bin/prisma', [
    'db', 'execute', '--schema', 'prisma/schema.prisma', '--file',
    `prisma/migrations/${number}_${name}/migration.sql`,
  ]);
}

try {
  console.log(`[Isolation] Creating schema ${schema}`);
  await adminDb.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  run('./node_modules/.bin/prisma', [
    'db', 'push', '--schema', 'prisma/schema.prisma', '--accept-data-loss', '--skip-generate',
  ]);
  testDb = new PrismaClient({ datasourceUrl: url.toString() });

  // Rewind only Item to its pre-migration-3 shape. Other tables remain the
  // current app shape so that the API can be exercised after migrations.
  await testDb.$executeRawUnsafe('ALTER TABLE "Item" DROP COLUMN "price_confirmed"');
  await testDb.$executeRawUnsafe('ALTER TABLE "Item" DROP COLUMN "karma_value"');
  await testDb.$executeRawUnsafe('ALTER TABLE "Item" RENAME COLUMN "price_vnd" TO "karma_value"');
  await testDb.$executeRawUnsafe('ALTER TABLE "Item" ALTER COLUMN "karma_value" SET NOT NULL');
  await testDb.$executeRawUnsafe(`
    CREATE TABLE "_prisma_migrations" (
      id VARCHAR(36) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);
  await testDb.$executeRawUnsafe(`
    INSERT INTO "Level" (level_id, level_name, min_karma, max_karma, borrow_limit, deposit_discount_pct)
    VALUES (1, 'Migration test', 0, 200, 2, 0)
  `);
  await testDb.$executeRawUnsafe(`
    INSERT INTO "User" (user_id, email, full_name, updated_at)
    VALUES (1, 'migration-owner@example.invalid', 'Migration owner', '2026-09-01')
  `);
  await testDb.$executeRawUnsafe(`
    INSERT INTO "Category" (category_id, name, updated_at)
    VALUES (1, 'Migration test', '2026-09-01')
  `);
  await testDb.$executeRawUnsafe(`
    INSERT INTO "Item" (item_id, owner_id, category_id, title, karma_value, type, created_at, updated_at)
    VALUES
      (10, 1, 1, 'Legacy 30 ID 10', 30, 'SELL', '2026-09-01', '2026-09-01'),
      (20, 1, 1, 'Legacy 2000', 2000, 'SELL', '2026-09-01', '2026-09-01'),
      (30, 1, 1, 'Legacy later confirmed', 40, 'SELL', '2026-09-01', '2026-09-01')
  `);

  migration(3, 'rename_karma_value_to_price_vnd');
  // The actual migration SQL must fail closed if migration history is absent.
  run('./node_modules/.bin/prisma', [
    'db', 'execute', '--schema', 'prisma/schema.prisma', '--file',
    'prisma/migrations/6_provenance_based_legacy_item_unconfirmation/migration.sql',
  ], true);
  await testDb.$executeRawUnsafe(`
    INSERT INTO "_prisma_migrations"
      (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
    VALUES
      ('00000000-0000-0000-0000-000000000003', 'test-fixture',
       '3_rename_karma_value_to_price_vnd',
       '2026-09-23 00:00:00+00', '2026-09-23 00:00:01+00', 1)
  `);
  migration(4, 'preserve_karma_and_flag_legacy_items');
  await testDb.$executeRawUnsafe(`
    INSERT INTO "Item" (item_id, owner_id, category_id, title, price_vnd, type, created_at, updated_at)
    VALUES
      (40, 1, 1, 'VND 0', 0, 'SELL', '2026-09-24', '2026-09-24'),
      (41, 1, 1, 'VND 500', 500, 'SELL', '2026-09-24', '2026-09-24'),
      (42, 1, 1, 'VND 5000000', 5000000, 'SELL', '2026-09-24', '2026-09-24')
  `);
  migration(5, 'rule_based_legacy_item_price_confirmation');
  const polluted = await testDb.item.findUniqueOrThrow({ where: { item_id: 41 } });
  if (polluted.karma_value !== 500 || polluted.price_confirmed !== false) {
    throw new Error('Fixture did not reproduce migration 5 low-VND pollution');
  }
  await testDb.item.update({
    where: { item_id: 30 },
    data: { price_vnd: 12000, price_confirmed: true, updated_at: new Date('2026-09-25') },
  });
  migration(6, 'provenance_based_legacy_item_unconfirmation');
  run('./node_modules/.bin/vitest', ['run', '--config', 'vitest.config.migration.ts']);
} finally {
  await testDb?.$disconnect();
  try {
    if (schemaCreated) {
      console.log(`[Isolation] Dropping schema ${schema}`);
      await adminDb.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
  } finally {
    await adminDb.$disconnect();
  }
}
