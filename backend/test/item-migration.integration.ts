import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { prisma } from '../src/prisma.js';

if (
  !process.env.MIGRATION_TEST_SCHEMA?.startsWith('s2s_mig_test_') ||
  new URL(process.env.DATABASE_URL!).searchParams.get('schema') !==
    process.env.MIGRATION_TEST_SCHEMA
) {
  throw new Error('Run via isolated migration runner; never use shared application data.');
}

describe('Item migrations 3–6 (isolated schema)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('unconfirms old karma 30 and 2000, including item ID 10', async () => {
    for (const [id, karma] of [[10, 30], [20, 2000]]) {
      const item = await prisma.item.findUniqueOrThrow({ where: { item_id: id } });
      expect(item.karma_value).toBe(karma);
      expect(item.price_confirmed).toBe(false);
    }
  });

  it('preserves owner-confirmed old item with a distinct VND amount', async () => {
    const item = await prisma.item.findUniqueOrThrow({ where: { item_id: 30 } });
    expect(item.karma_value).toBe(40);
    expect(item.price_vnd).toBe(12000);
    expect(item.price_confirmed).toBe(true);
  });

  it('repairs low VND values polluted by migration 5 and preserves high VND', async () => {
    for (const [id, price] of [[40, 0], [41, 500], [42, 5000000]]) {
      const item = await prisma.item.findUniqueOrThrow({ where: { item_id: id } });
      expect(item.price_vnd).toBe(price);
      expect(item.karma_value).toBeNull();
      expect(item.price_confirmed).toBe(true);
    }
  });

  it('only publishes confirmed VND items through GET /api/items', async () => {
    const response = await request(app.getHttpServer()).get('/api/items').expect(200);
    const ids = response.body.data.map((item: { item_id: number }) => item.item_id);
    expect(ids.sort((a: number, b: number) => a - b)).toEqual([30, 40, 41, 42]);
    for (const item of response.body.data) {
      expect(item).not.toHaveProperty('karma_value');
      expect(item.price_confirmed).toBe(true);
    }
  });
});
