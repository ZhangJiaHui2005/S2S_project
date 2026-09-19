import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const schema = `s2s_auth_test_${randomBytes(8).toString('hex')}`;
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('schema', schema);
const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  AUTH_TEST_SCHEMA: schema,
  BETTER_AUTH_SECRET: randomBytes(48).toString('hex'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  BETTER_AUTH_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:3000',
  NODE_ENV: 'test',
};
const db = new PrismaClient();
const directory = await mkdtemp(join(tmpdir(), 's2s-auth-test-'));
function run(binary, args) {
  const result = spawnSync(binary, args, { env, stdio: 'inherit' });
  if (result.status !== 0)
    throw new Error(`${binary} failed (${result.status})`);
}
try {
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  let baseline = await readFile('test/fixtures/auth-baseline.sql', 'utf8');
  baseline = baseline.replace('CREATE SCHEMA IF NOT EXISTS "public";', '');
  baseline += `
INSERT INTO "Level" (level_id, level_name, min_karma, max_karma, borrow_limit, deposit_discount_pct)
VALUES (1, 'Test default', 0, 200, 2, 0);
INSERT INTO "User" (email, full_name, karma_balance, updated_at)
VALUES ('legacy@example.invalid', 'Legacy profile', 432, CURRENT_TIMESTAMP);
INSERT INTO "user" (id, name, email, "emailVerified", "updatedAt")
VALUES ('auth-before-migration', 'Existing account', 'before@example.invalid', false, CURRENT_TIMESTAMP);
`;
  const fixture = join(directory, 'baseline.sql');
  await writeFile(fixture, baseline);
  run('./node_modules/.bin/prisma', [
    'db',
    'execute',
    '--schema',
    'prisma/schema.prisma',
    '--file',
    fixture,
  ]);
  run('./node_modules/.bin/prisma', [
    'db',
    'execute',
    '--schema',
    'prisma/schema.prisma',
    '--file',
    'prisma/migrations/2_harden_auth_sessions_and_profiles/migration.sql',
  ]);
  run('./node_modules/.bin/vitest', [
    'run',
    '--config',
    'vitest.config.auth.ts',
  ]);
} finally {
  // Only this run's randomly generated, isolated test schema can be removed.
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await db.$disconnect();
  await rm(directory, { recursive: true, force: true });
}
