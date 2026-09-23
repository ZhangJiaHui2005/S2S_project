import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== PREFLIGHT / AUDIT ITEM PRICES REPORT ===');

  const totalItems = await prisma.item.count();
  const confirmedCount = await prisma.item.count({
    where: { price_confirmed: true },
  });
  const unconfirmedCount = await prisma.item.count({
    where: { price_confirmed: false },
  });
  const legacyKarmaCount = await prisma.item.count({
    where: { karma_value: { not: null } },
  });

  console.log(`Total items in database: ${totalItems}`);
  console.log(`Confirmed items (price_confirmed = true): ${confirmedCount}`);
  console.log(`Unconfirmed items (price_confirmed = false): ${unconfirmedCount}`);
  console.log(`Items with karma_value: ${legacyKarmaCount}`);

  const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
    SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at ASC
  `;
  console.log('\n--- Applied Migrations ---');
  for (const m of migrations) {
    console.log(`Migration: ${m.migration_name.padEnd(50)} | Finished: ${m.finished_at?.toISOString()}`);
  }

  const allItems = await prisma.item.findMany({
    select: {
      item_id: true,
      title: true,
      status: true,
      price_vnd: true,
      karma_value: true,
      price_confirmed: true,
      created_at: true,
    },
    orderBy: { item_id: 'asc' },
  });

  console.log('\n--- Item Details ---');
  for (const it of allItems) {
    console.log(
      `ID: ${it.item_id.toString().padEnd(4)} | Status: ${it.status.padEnd(9)} | Confirmed: ${String(it.price_confirmed).padEnd(5)} | Price VND: ${String(it.price_vnd).padStart(9)} | Karma: ${String(it.karma_value).padStart(4)} | Created: ${it.created_at.toISOString()} | Title: ${it.title}`,
    );
    if (it.item_id === 10) {
      const full10 = await prisma.item.findUnique({
        where: { item_id: 10 },
        include: { User: true, Category: true },
      });
      console.log('Item 10 Full Record:', JSON.stringify(full10, null, 2));
    }
  }
}

main()
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
