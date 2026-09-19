import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { prisma } from '../prisma.js';

const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AdminLoginLimiter {
  async consume(email: string, ip: string): Promise<number> {
    const now = new Date();
    const expires = new Date(now.getTime() + WINDOW_MS);
    const buckets = [
      { scope: 'email', value: email, limit: 10 },
      { scope: 'ip', value: ip, limit: 30 },
    ];
    // PostgreSQL upserts serialize concurrent attempts, across all backend instances.
    return prisma.$transaction(async (tx) => {
      await tx.adminLoginAttempt.deleteMany({
        where: { expires_at: { lte: now } },
      });
      let retryAfter = 0;
      for (const bucket of buckets) {
        const key = createHash('sha256')
          .update(`${bucket.scope}:${bucket.value}`)
          .digest('hex');
        const entry = await tx.adminLoginAttempt.upsert({
          where: { key },
          create: { key, count: 1, expires_at: expires },
          update: { count: { increment: 1 } },
          select: { count: true, expires_at: true },
        });
        if (entry.count > bucket.limit) {
          retryAfter = Math.max(
            retryAfter,
            Math.ceil((entry.expires_at.getTime() - now.getTime()) / 1000),
          );
        }
      }
      return retryAfter;
    });
  }
}
