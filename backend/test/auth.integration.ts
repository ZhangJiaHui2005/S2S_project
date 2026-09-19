import { execFileSync } from 'node:child_process';
import type { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth } from '../src/auth.js';
import { authDatabase } from '../src/auth-database.js';
import { prisma } from '../src/prisma.js';
import { AdminService } from '../src/admin/admin.service.js';
import { AdminController } from '../src/admin/admin.controller.js';
import { AdminLoginLimiter } from '../src/admin/admin-login-limiter.js';
import { AdminJwtGuard } from '../src/admin/guards/admin-jwt.guard.js';

if (
  !process.env.AUTH_TEST_SCHEMA?.startsWith('s2s_auth_test_') ||
  new URL(process.env.DATABASE_URL!).searchParams.get('schema') !==
    process.env.AUTH_TEST_SCHEMA
) {
  throw new Error(
    'Run npm run test:auth:integration; never run these tests against application data.',
  );
}

const service = new AdminService();
const guard = new AdminJwtGuard();
const limiter = new AdminLoginLimiter();
const controller = new AdminController(service, limiter);
const password = 'Review-password-123!';
const context = (token: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }),
    }),
  }) as ExecutionContext;
const response = () =>
  ({
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    setHeader: vi.fn(),
  }) as unknown as Response;
const req = (ip = '192.0.2.1') =>
  ({ headers: {}, ip, socket: { remoteAddress: ip } }) as Request;
async function callAuth(path: string, body?: object, cookie?: string) {
  return auth.handler(
    new Request(`http://localhost:3001/api/auth/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}
function sessionCookie(res: globalThis.Response) {
  return res.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

beforeAll(async () => {
  await prisma.admin.create({
    data: {
      email: 'admin@example.invalid',
      full_name: 'Test admin',
      updated_at: new Date(),
      password_hash: await bcrypt.hash(password, 10),
    },
  });
});
afterAll(async () => {
  await prisma.$disconnect();
});

it('migration preserves old domain data and backfills existing auth accounts without marking them verified', async () => {
  const old = await prisma.user.findUniqueOrThrow({
    where: { email: 'legacy@example.invalid' },
  });
  expect(old.karma_balance).toBe(432);
  expect(old.auth_user_id).toBeNull();
  const backfilled = await prisma.user.findUniqueOrThrow({
    where: { auth_user_id: 'auth-before-migration' },
  });
  expect(backfilled.karma_balance).toBe(100);
  expect(backfilled.is_verified).toBe(false);
});

it('registers, links the domain profile, rejects duplicate/wrong login, and revokes user sessions on sign-out', async () => {
  const email = 'new-user@example.invalid';
  const registered = await callAuth('sign-up/email', {
    name: 'New User',
    email,
    password,
  });
  expect(registered.status).toBe(200);
  const data = await registered.json();
  const domain = await prisma.user.findUniqueOrThrow({
    where: { auth_user_id: data.user.id },
  });
  expect(domain.email).toBe(email);
  expect(domain.is_verified).toBe(false);
  expect(domain.karma_balance).toBe(100);
  const duplicate = await callAuth('sign-up/email', {
    name: 'Another',
    email,
    password,
  });
  expect(duplicate.ok).toBe(false);
  const wrong = await callAuth('sign-in/email', {
    email,
    password: 'incorrect-password',
  });
  expect(wrong.status).toBe(401);
  const signedIn = await callAuth('sign-in/email', { email, password });
  expect(signedIn.status).toBe(200);
  const cookie = sessionCookie(signedIn);
  const session = await callAuth('get-session', undefined, cookie);
  expect((await session.json()).user.id).toBe(data.user.id);
  expect((await callAuth('sign-out', {}, cookie)).status).toBe(200);
  expect(
    await (await callAuth('get-session', undefined, cookie)).json(),
  ).toBeNull();
});

it('does not claim a legacy domain account by registering its unverified email', async () => {
  const res = await callAuth('sign-up/email', {
    name: 'Impersonator',
    email: 'legacy@example.invalid',
    password,
  });
  expect(res.ok).toBe(false);
  expect(
    await prisma.betterAuthUser.count({
      where: { email: 'legacy@example.invalid' },
    }),
  ).toBe(0);
  expect(
    (
      await prisma.user.findUniqueOrThrow({
        where: { email: 'legacy@example.invalid' },
      })
    ).karma_balance,
  ).toBe(432);
});

it('rolls back both auth and domain writes if profile creation fails', async () => {
  const before = await prisma.betterAuthUser.count();
  await expect(
    authDatabase.betterAuthUser.create({
      data: {
        id: 'rollback-test',
        email: 'legacy@example.invalid',
        name: 'Rollback',
      },
    }),
  ).rejects.toThrow();
  expect(await prisma.betterAuthUser.count()).toBe(before);
});

it('logout revokes only the current admin session; old stateless JWTs are rejected', async () => {
  const first = await service.login('admin@example.invalid', password);
  const second = await service.login('admin@example.invalid', password);
  expect(first.token).not.toBe(second.token);
  expect(await guard.canActivate(context(first.token))).toBe(true);
  const logoutResponse = response();
  await controller.logout(
    {
      ...req(),
      headers: { cookie: `s2s_admin_token=${first.token}` },
    } as Request,
    logoutResponse,
  );
  expect(logoutResponse.clearCookie).toHaveBeenCalled();
  await expect(guard.canActivate(context(first.token))).rejects.toMatchObject({
    status: 401,
  });
  expect(await guard.canActivate(context(second.token))).toBe(true);
  const oldToken = jwt.sign(
    { adminId: first.admin.adminId, role: 'admin' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
  await expect(guard.canActivate(context(oldToken))).rejects.toMatchObject({
    status: 401,
  });
});

it('changing password rejects every previous admin token and old password', async () => {
  const first = await service.login('admin@example.invalid', password);
  const second = await service.login('admin@example.invalid', password);
  const newPassword = 'New-review-password!';
  const res = response();
  const request = Object.assign(req(), {
    admin: { ...first.admin, version: 0, role: 'admin' as const },
  });
  expect(
    (await controller.setPassword(request, { newPassword }, res)).requiresLogin,
  ).toBe(true);
  expect(res.clearCookie).toHaveBeenCalled();
  await expect(guard.canActivate(context(first.token))).rejects.toMatchObject({
    status: 401,
  });
  await expect(guard.canActivate(context(second.token))).rejects.toMatchObject({
    status: 401,
  });
  await expect(
    service.login('admin@example.invalid', password),
  ).rejects.toMatchObject({ status: 401 });
  const fresh = await service.login('admin@example.invalid', newPassword);
  expect(await guard.canActivate(context(fresh.token))).toBe(true);
});

it('rejects malformed input and short/oversized bcrypt passwords before querying credentials', async () => {
  await expect(
    controller.login({ email: 123, password }, req(), response()),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    controller.login(
      { email: 'admin@example.invalid', password: {} },
      req(),
      response(),
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    controller.setPassword(
      req(),
      { email: 'admin@example.invalid', newPassword: '123456' },
      response(),
    ),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    service.setPassword('admin@example.invalid', 'é'.repeat(37)),
  ).rejects.toMatchObject({ status: 400 });
});

it('limits parallel login attempts per account across instances and emits Retry-After', async () => {
  const attempts = await Promise.all(
    Array.from({ length: 11 }, (_, i) =>
      new AdminLoginLimiter().consume(
        'limit@example.invalid',
        `192.0.2.${i + 10}`,
      ),
    ),
  );
  expect(attempts.filter((value) => value > 0)).toHaveLength(1);
  const res = response();
  await expect(
    controller.login(
      { email: 'limit@example.invalid', password },
      req('192.0.2.99'),
      res,
    ),
  ).rejects.toMatchObject({ status: 429 });
  expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  await prisma.adminLoginAttempt.updateMany({
    data: { expires_at: new Date(0) },
  });
  expect(await limiter.consume('limit@example.invalid', '192.0.2.99')).toBe(0);
});

it('the CLI password reset also revokes previously issued admin sessions', async () => {
  const session = await service.login(
    'admin@example.invalid',
    'New-review-password!',
  );
  execFileSync(
    process.execPath,
    [
      'scripts/set-admin-password.ts',
      'admin@example.invalid',
      'CLI-review-password!',
    ],
    {
      env: process.env,
      stdio: 'pipe',
    },
  );
  await expect(guard.canActivate(context(session.token))).rejects.toMatchObject(
    { status: 401 },
  );
  const current = await service.login(
    'admin@example.invalid',
    'CLI-review-password!',
  );
  expect(await guard.canActivate(context(current.token))).toBe(true);
});

it('limits attempts against many accounts coming from the same IP', async () => {
  for (let i = 0; i < 30; i++) {
    expect(
      await limiter.consume(`ip-limit-${i}@example.invalid`, '198.51.100.1'),
    ).toBe(0);
  }
  expect(
    await limiter.consume('ip-limit-last@example.invalid', '198.51.100.1'),
  ).toBeGreaterThan(0);
});
