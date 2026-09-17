import 'dotenv/config';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { prisma } from './prisma.js';

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  appName: 'S2S',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
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
  trustedOrigins: [frontendUrl],
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
