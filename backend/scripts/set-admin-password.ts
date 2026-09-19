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

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new Error(
      'Email không hợp lệ hoặc mật khẩu không đáp ứng tối thiểu 8 ký tự, tối đa 72 byte UTF-8.',
    );
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
        session_version: { increment: 1 },
        updated_at: new Date(),
      },
    });
    await prisma.adminSession.deleteMany({
      where: { admin_id: updated.admin_id },
    });
    console.log(
      `Successfully updated password for admin ID ${updated.admin_id} (${updated.email})`,
    );
  } else {
    const created = await prisma.admin.create({
      data: {
        email,
        password_hash,
        full_name: fullName,
        updated_at: new Date(),
      },
    });
    console.log(
      `Successfully created new admin ID ${created.admin_id} (${created.email})`,
    );
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
