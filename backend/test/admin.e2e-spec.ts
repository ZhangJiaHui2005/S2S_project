import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AdminController (e2e)', () => {
  let app: INestApplication<App>;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const hasAdminCredentials = Boolean(adminEmail && adminPassword);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({
      bodyParser: false,
    });

    const jsonParser = express.json();
    const urlencodedParser = express.urlencoded({ extended: true });

    app.use((req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl || req.url || '';
      if (url.startsWith('/api/auth')) {
        return next();
      }
      return jsonParser(req, res, (err) => {
        if (err) return next(err);
        return urlencodedParser(req, res, next);
      });
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects login with wrong password (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/login')
      .send({
        email: adminEmail ?? 'missing-admin@example.com',
        password: 'WrongPassword@999',
      });

    expect(res.status).toBe(401);
  });

  it.skipIf(!hasAdminCredentials)(
    'logs in successfully with valid credentials and sets cookie',
    async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/login')
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.admin.email).toBe(adminEmail);
    expect(res.headers['set-cookie']).toBeDefined();

    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('s2s_admin_token=');

    // Test GET /api/admin/me
    const meRes = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Cookie', cookieHeader);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.admin.email).toBe(adminEmail);

    // Test GET /api/admin/stats
    const statsRes = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Cookie', cookieHeader);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.stats).toBeDefined();

    // Test POST /api/admin/logout
    const logoutRes = await request(app.getHttpServer())
      .post('/api/admin/logout');

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    },
  );
});
