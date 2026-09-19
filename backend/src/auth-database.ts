import { prisma } from './prisma.js';

// A nested Prisma write creates both identities atomically. If either insert fails,
// neither account is left behind. IDs, not unverified email matches, link accounts.
export const authDatabase = prisma.$extends({
  query: {
    betterAuthUser: {
      async create({ args, query }) {
        const data = args.data;
        return query({
          ...args,
          data: {
            ...data,
            businessUser: {
              create: {
                email: data.email,
                full_name: data.name,
                avatar: data.image,
                is_verified: data.emailVerified ?? false,
                updated_at: new Date(),
                Level: { connect: { level_id: 1 } },
              },
            },
          },
        });
      },
    },
  },
});
