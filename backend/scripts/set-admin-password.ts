import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD || '';
  const fullName = args[2] || process.env.ADMIN_FULL_NAME || 'Quản trị viên';

  if (!email || !password) {
    console.error(
      'Usage: npm run admin:set-password -- <email> <password> [full_name]',
    );
    process.exit(1);
  }

  console.log(`Setting password for admin: ${email}...`);
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    const updated = await prisma.admin.update({
      where: { email },
      data: {
        password_hash,
        updated_at: new Date(),
      },
    });
    console.log(`Successfully updated password for admin ID ${updated.admin_id} (${updated.email})`);
  } else {
    const created = await prisma.admin.create({
      data: {
        email,
        password_hash,
        full_name: fullName,
        updated_at: new Date(),
      },
    });
    console.log(`Successfully created new admin ID ${created.admin_id} (${created.email})`);
  }

  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((e) => {
    console.error('Error setting admin password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
