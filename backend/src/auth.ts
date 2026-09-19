import 'dotenv/config';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { prisma } from './prisma.js';
import { authDatabase } from './auth-database.js';
import { APIError } from 'better-auth/api';

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  appName: 'S2S',
  database: prismaAdapter(authDatabase, {
    provider: 'postgresql',
    transaction: true,
  }),
  user: {
    modelName: 'betterAuthUser',
  },
  session: {
    modelName: 'betterAuthSession',
  },
  account: {
    modelName: 'betterAuthAccount',
  },
  verification: {
    modelName: 'betterAuthVerification',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const name = user.name.trim();
          if (name.length < 2 || name.length > 100) {
            throw new APIError('BAD_REQUEST', {
              message: 'Họ tên phải có từ 2 đến 100 ký tự.',
            });
          }
          // Never claim a legacy profile merely by registering its email.
          const existing = await prisma.user.findFirst({
            where: { email: { equals: user.email, mode: 'insensitive' } },
            select: { user_id: true },
          });
          if (existing) {
            throw new APIError('BAD_REQUEST', {
              message:
                'Email đã có hồ sơ trên hệ thống. Vui lòng liên hệ quản trị để khôi phục tài khoản.',
            });
          }
          return { data: { ...user, name } };
        },
      },
    },
  },
  trustedOrigins: [frontendUrl],
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
