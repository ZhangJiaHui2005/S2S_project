import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { auth } from '../src/auth.js';
import { prisma } from '../src/prisma.js';

if (
  !process.env.E2E_TEST_SCHEMA?.startsWith('s2s_e2e_test_') ||
  new URL(process.env.DATABASE_URL!).searchParams.get('schema') !==
    process.env.E2E_TEST_SCHEMA
) {
  throw new Error(
    'Run npm run test:e2e; never run these tests against shared application data.',
  );
}

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

describe('ItemController (e2e)', () => {
  let app: INestApplication<App>;
  let categoryId: number;
  let cookieA: string;
  let cookieB: string;
  let userAAuthId: string;
  let userBAuthId: string;
  let userADomainId: number;
  let userBDomainId: number;

  const createdItemIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Ensure category exists
    let cat = await prisma.category.findFirst();
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: 'Test Category', updated_at: new Date() },
      });
    }
    categoryId = cat.category_id;

    // Register User A
    const ts = Date.now();
    const emailA = `test_user_a_${ts}@example.invalid`;
    const resA = await callAuth('sign-up/email', {
      name: 'User A',
      email: emailA,
      password: 'Password123!',
    });
    cookieA = sessionCookie(resA);
    const dataA = await resA.json();
    userAAuthId = dataA.user.id;
    const userADomain = await prisma.user.findUniqueOrThrow({
      where: { auth_user_id: userAAuthId },
    });
    userADomainId = userADomain.user_id;

    // Register User B
    const emailB = `test_user_b_${ts + 1}@example.invalid`;
    const resB = await callAuth('sign-up/email', {
      name: 'User B',
      email: emailB,
      password: 'Password123!',
    });
    cookieB = sessionCookie(resB);
    const dataB = await resB.json();
    userBAuthId = dataB.user.id;
    const userBDomain = await prisma.user.findUniqueOrThrow({
      where: { auth_user_id: userBAuthId },
    });
    userBDomainId = userBDomain.user_id;
  });

  afterAll(async () => {
    if (createdItemIds.length > 0) {
      await prisma.borrowRequest.deleteMany({
        where: { item_id: { in: createdItemIds } },
      });
      await prisma.transaction.deleteMany({
        where: { item_id: { in: createdItemIds } },
      });
      await prisma.item.deleteMany({
        where: { item_id: { in: createdItemIds } },
      });
    }

    if (userADomainId) {
      await prisma.item.deleteMany({ where: { owner_id: userADomainId } });
      await prisma.user.deleteMany({ where: { user_id: userADomainId } });
    }
    if (userBDomainId) {
      await prisma.item.deleteMany({ where: { owner_id: userBDomainId } });
      await prisma.user.deleteMany({ where: { user_id: userBDomainId } });
    }
    if (userAAuthId) {
      await prisma.betterAuthSession.deleteMany({ where: { userId: userAAuthId } });
      await prisma.betterAuthAccount.deleteMany({ where: { userId: userAAuthId } });
      await prisma.betterAuthUser.deleteMany({ where: { id: userAAuthId } });
    }
    if (userBAuthId) {
      await prisma.betterAuthSession.deleteMany({ where: { userId: userBAuthId } });
      await prisma.betterAuthAccount.deleteMany({ where: { userId: userBAuthId } });
      await prisma.betterAuthUser.deleteMany({ where: { id: userBAuthId } });
    }

    await app.close();
  });

  describe('1. Public Browsing', () => {
    it('returns 200 with paginated data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/items')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data)).toBe(true);

      for (const item of res.body.data) {
        expect(item.status).toBe('AVAILABLE');
        expect(item.price_confirmed).toBe(true);
        expect(item).not.toHaveProperty('karma_value');
      }
    });

    it('returns 400 if minPriceVnd > maxPriceVnd', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/items?minPriceVnd=100000&maxPriceVnd=50000')
        .expect(400);

      expect(res.body.message).toContain('Giá tối thiểu không được lớn hơn giá tối đa');
    });

    it('returns 400 if minPriceVnd is negative', async () => {
      await request(app.getHttpServer())
        .get('/api/items?minPriceVnd=-1')
        .expect(400);
    });
  });

  describe('2. Authentication & Validation', () => {
    it('returns 401 when accessing protected routes without session', async () => {
      await request(app.getHttpServer())
        .get('/api/items/mine')
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/items')
        .send({
          type: 'SELL',
          title: 'Sách giáo trình',
          category_id: categoryId,
          price_vnd: 50000,
        })
        .expect(401);
    });

    it('returns exactly 400 when authenticated user submits whitespace-only title', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/items')
        .set('Cookie', cookieA)
        .send({
          type: 'SELL',
          title: '     ',
          category_id: categoryId,
          price_vnd: 50000,
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      const msg = Array.isArray(res.body.message) ? res.body.message.join(' ') : res.body.message;
      expect(msg).toMatch(/Tiêu đề/i);
    });

    it('creates an item successfully for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/items')
        .set('Cookie', cookieA)
        .send({
          type: 'SELL',
          title: 'Giáo trình Giải tích 1 chuẩn',
          category_id: categoryId,
          price_vnd: 65000,
        })
        .expect(201);

      expect(res.body.item_id).toBeDefined();
      expect(res.body.title).toBe('Giáo trình Giải tích 1 chuẩn');
      expect(res.body.price_vnd).toBe(65000);
      expect(res.body.price_confirmed).toBe(true);
      expect(res.body).not.toHaveProperty('karma_value');

      createdItemIds.push(res.body.item_id);
    });
  });

  describe('3. Multi-User Authorization & Isolation (A/B)', () => {
    let itemAId: number;

    beforeAll(async () => {
      const itemA = await prisma.item.create({
        data: {
          owner_id: userADomainId,
          category_id: categoryId,
          title: 'Vật phẩm của User A',
          type: 'SELL',
          price_vnd: 80000,
          price_confirmed: true,
          status: 'AVAILABLE',
          updated_at: new Date(),
        },
      });
      itemAId = itemA.item_id;
      createdItemIds.push(itemAId);
    });

    it('allows User A to manage their own item', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/items/${itemAId}/manage`)
        .set('Cookie', cookieA)
        .expect(200);

      expect(res.body.item_id).toBe(itemAId);
      expect(res.body.is_owner).toBe(true);
    });

    it('rejects User B from managing User A item with 403', async () => {
      await request(app.getHttpServer())
        .get(`/api/items/${itemAId}/manage`)
        .set('Cookie', cookieB)
        .expect(403);
    });

    it('rejects User B from updating User A item with 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/items/${itemAId}`)
        .set('Cookie', cookieB)
        .send({ title: 'Hacked by User B' })
        .expect(403);
    });

    it('rejects User B from deleting User A item with 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/items/${itemAId}`)
        .set('Cookie', cookieB)
        .expect(403);
    });
  });

  describe('4. Legacy Unconfirmed Price Workflow', () => {
    let unconfirmedId: number;

    beforeAll(async () => {
      const item = await prisma.item.create({
        data: {
          owner_id: userADomainId,
          category_id: categoryId,
          title: 'Máy tính Casio thời Karma cũ',
          type: 'SELL',
          price_vnd: 45,
          karma_value: 45,
          price_confirmed: false,
          status: 'AVAILABLE',
          updated_at: new Date(),
        },
      });
      unconfirmedId = item.item_id;
      createdItemIds.push(unconfirmedId);
    });

    it('hides unconfirmed item from public browse', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/items')
        .expect(200);

      const found = res.body.data.some((it: any) => it.item_id === unconfirmedId);
      expect(found).toBe(false);
    });

    it('shows unconfirmed item in findMine with price_vnd as null and karma_value stripped', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/items/mine')
        .set('Cookie', cookieA)
        .expect(200);

      const found = res.body.data.find((it: any) => it.item_id === unconfirmedId);
      expect(found).toBeDefined();
      expect(found.price_confirmed).toBe(false);
      expect(found.price_vnd).toBeNull();
      expect(found).not.toHaveProperty('karma_value');
    });

    it('updating only title preserves price_confirmed = false and does not publish item', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/items/${unconfirmedId}`)
        .set('Cookie', cookieA)
        .send({ title: 'Máy tính Casio đã đổi tiêu đề' })
        .expect(200);

      expect(res.body.title).toBe('Máy tính Casio đã đổi tiêu đề');
      expect(res.body.price_confirmed).toBe(false);
      expect(res.body.price_vnd).toBeNull();

      // Still hidden from public
      const publicRes = await request(app.getHttpServer())
        .get('/api/items')
        .expect(200);
      expect(publicRes.body.data.some((it: any) => it.item_id === unconfirmedId)).toBe(false);
    });

    it('updating with real price_vnd confirms price and publishes item', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/items/${unconfirmedId}`)
        .set('Cookie', cookieA)
        .send({ price_vnd: 250000 })
        .expect(200);

      expect(res.body.price_confirmed).toBe(true);
      expect(res.body.price_vnd).toBe(250000);

      // Now visible in public browse
      const publicRes = await request(app.getHttpServer())
        .get('/api/items')
        .expect(200);
      expect(publicRes.body.data.some((it: any) => it.item_id === unconfirmedId)).toBe(true);
    });
  });

  describe('5. Status Guards (LOCKED / EXCHANGED) & Conflict 409', () => {
    let lockedId: number;

    beforeAll(async () => {
      const item = await prisma.item.create({
        data: {
          owner_id: userADomainId,
          category_id: categoryId,
          title: 'Bài đăng đang giao dịch',
          type: 'LEND',
          price_vnd: 30000,
          price_confirmed: true,
          status: 'LOCKED',
          updated_at: new Date(),
        },
      });
      lockedId = item.item_id;
      createdItemIds.push(lockedId);
    });

    it('returns 409 when attempting manage on LOCKED item', async () => {
      await request(app.getHttpServer())
        .get(`/api/items/${lockedId}/manage`)
        .set('Cookie', cookieA)
        .expect(409);
    });

    it('returns 409 when attempting PATCH on LOCKED item', async () => {
      await request(app.getHttpServer())
        .patch(`/api/items/${lockedId}`)
        .set('Cookie', cookieA)
        .send({ title: 'Không thể sửa khi đang LOCKED' })
        .expect(409);
    });

    it('returns 409 when attempting DELETE on LOCKED item', async () => {
      await request(app.getHttpServer())
        .delete(`/api/items/${lockedId}`)
        .set('Cookie', cookieA)
        .expect(409);
    });
  });

  describe('6. Concurrency & Deletion with Active Requests', () => {
    let deletableId: number;

    beforeEach(async () => {
      const item = await prisma.item.create({
        data: {
          owner_id: userADomainId,
          category_id: categoryId,
          title: 'Bài đăng để test xóa',
          type: 'SELL',
          price_vnd: 40000,
          price_confirmed: true,
          status: 'AVAILABLE',
          updated_at: new Date(),
        },
      });
      deletableId = item.item_id;
      createdItemIds.push(deletableId);
    });

    it('prevents deletion and returns 409 if active borrow request exists', async () => {
      const borrowReq = await prisma.borrowRequest.create({
        data: {
          item_id: deletableId,
          borrower_id: userBDomainId,
          status: 'PENDING',
          updated_at: new Date(),
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/items/${deletableId}`)
        .set('Cookie', cookieA)
        .expect(409);

      // Clean up request so subsequent delete succeeds
      await prisma.borrowRequest.delete({
        where: { request_id: borrowReq.request_id },
      });

      await request(app.getHttpServer())
        .delete(`/api/items/${deletableId}`)
        .set('Cookie', cookieA)
        .expect(204);

      // Item is now soft-deleted
      await request(app.getHttpServer())
        .get(`/api/items/${deletableId}`)
        .expect(404);
    });

    it('allows only one of two simultaneous DELETE requests', async () => {
      const raceItem = await prisma.item.create({
        data: {
          owner_id: userADomainId,
          category_id: categoryId,
          title: 'Simultaneous Concurrent Deletion Item',
          type: 'SELL',
          price_vnd: 50000,
          price_confirmed: true,
          status: 'AVAILABLE',
          updated_at: new Date(),
        },
      });
      createdItemIds.push(raceItem.item_id);

      // Fire two concurrent DELETE calls simultaneously via Promise.all
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .delete(`/api/items/${raceItem.item_id}`)
          .set('Cookie', cookieA),
        request(app.getHttpServer())
          .delete(`/api/items/${raceItem.item_id}`)
          .set('Cookie', cookieA),
      ]);

      const statuses = [res1.status, res2.status].sort((a, b) => a - b);
      // The conditional status update permits only one successful deletion.
      expect(statuses[0]).toBe(204);
      expect([404, 409]).toContain(statuses[1]);

      // Final state in database must be strictly DELETED
      const finalItem = await prisma.item.findUnique({
        where: { item_id: raceItem.item_id },
      });
      expect(finalItem?.status).toBe('DELETED');
    });
  });

  describe('7. Pagination (> 12 items)', () => {
    beforeAll(async () => {
      const bulkItems = Array.from({ length: 14 }, (_, i) => ({
        owner_id: userADomainId,
        category_id: categoryId,
        title: `Bulk Pagination Item ${i + 1}`,
        type: 'SELL' as const,
        price_vnd: 10000 * (i + 1),
        price_confirmed: true,
        status: 'AVAILABLE' as const,
        updated_at: new Date(),
      }));

      for (const itemData of bulkItems) {
        const item = await prisma.item.create({ data: itemData });
        createdItemIds.push(item.item_id);
      }
    });

    it('paginates correctly on page 1 and page 2', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/items/mine?page=1&limit=12')
        .set('Cookie', cookieA)
        .expect(200);

      expect(page1.body.data.length).toBe(12);
      expect(page1.body.page).toBe(1);
      expect(page1.body.limit).toBe(12);
      expect(page1.body.total).toBeGreaterThanOrEqual(14);
      expect(page1.body.totalPages).toBeGreaterThanOrEqual(2);

      const page2 = await request(app.getHttpServer())
        .get('/api/items/mine?page=2&limit=12')
        .set('Cookie', cookieA)
        .expect(200);

      expect(page2.body.data.length).toBeGreaterThanOrEqual(2);
      expect(page2.body.page).toBe(2);
    });
  });
});
