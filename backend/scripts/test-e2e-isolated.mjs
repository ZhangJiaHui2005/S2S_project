import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const schema = `s2s_e2e_test_${randomBytes(8).toString('hex')}`;
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('schema', schema);

const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  E2E_TEST_SCHEMA: schema,
  BETTER_AUTH_SECRET: randomBytes(48).toString('hex'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  BETTER_AUTH_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
};

const db = new PrismaClient();
let schemaCreated = false;

function run(binary, args) {
  const result = spawnSync(binary, args, { env, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${binary} ${args.join(' ')} failed (${result.status})`);
  }
}

try {
  console.log(`[Isolation] Creating isolated test schema: ${schema}`);
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;

  console.log('[Isolation] Deploying Prisma schema into isolated test schema...');
  run('./node_modules/.bin/prisma', [
    'db',
    'push',
    '--schema',
    'prisma/schema.prisma',
    '--accept-data-loss',
    '--skip-generate',
  ]);

  // Seed baseline Level in isolated schema
  const testDb = new PrismaClient({ datasourceUrl: url.toString() });
  await testDb.$executeRawUnsafe(`
    INSERT INTO "Level" (level_id, level_name, min_karma, max_karma, borrow_limit, deposit_discount_pct)
    VALUES (1, 'Test default', 0, 200, 2, 0)
    ON CONFLICT (level_id) DO NOTHING;
  `);
  await testDb.$disconnect();

  console.log('[Isolation] Running E2E test suite in isolated schema...');
  run('./node_modules/.bin/vitest', [
    'run',
    '--config',
    './vitest.config.e2e.ts',
  ]);
} finally {
  try {
    if (schemaCreated) {
      console.log(`[Isolation] Dropping isolated test schema: ${schema}`);
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
  } finally {
    await db.$disconnect();
  }
}
