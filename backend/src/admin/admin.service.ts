import { randomUUID } from 'node:crypto';
import { hashAdminToken } from './admin-token.js';
import {
  normalizeAdminEmail,
  validateAdminPassword,
} from './admin-validation.js';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import type { AdminJwtPayload } from './guards/admin-jwt.guard.js';

@Injectable()
export class AdminService {
  private get jwtSecret(): string {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      throw new Error('JWT_SECRET chưa được cấu hình.');
    }
    return secret;
  }

  async login(emailInput: unknown, passwordInput: unknown) {
    const email = normalizeAdminEmail(emailInput);
    const password = validateAdminPassword(passwordInput);
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException(
        'Email quản trị hoặc mật khẩu không chính xác.',
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException(
        'Email quản trị hoặc mật khẩu không chính xác.',
      );
    }

    // Update last_login_at
    const now = new Date();
    const payload: AdminJwtPayload = {
      adminId: admin.admin_id,
      email: admin.email,
      fullName: admin.full_name,
      role: 'admin',
      version: admin.session_version,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '7d',
      algorithm: 'HS256',
      jwtid: randomUUID(),
    });

    await prisma.$transaction(async (tx) => {
      const result = await tx.admin.updateMany({
        where: {
          admin_id: admin.admin_id,
          password_hash: admin.password_hash,
          session_version: admin.session_version,
        },
        data: { last_login_at: now, updated_at: now },
      });
      if (!result.count)
        throw new UnauthorizedException(
          'Mật khẩu vừa thay đổi. Vui lòng đăng nhập lại.',
        );
      await tx.adminSession.deleteMany({
        where: { admin_id: admin.admin_id, expires_at: { lte: now } },
      });
      await tx.adminSession.create({
        data: {
          token_hash: hashAdminToken(token),
          admin_id: admin.admin_id,
          version: admin.session_version,
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    return {
      token,
      admin: {
        adminId: admin.admin_id,
        email: admin.email,
        fullName: admin.full_name,
        lastLoginAt: now,
        role: 'admin',
      },
    };
  }

  async getProfile(adminId: number) {
    const admin = await prisma.admin.findUnique({
      where: { admin_id: adminId },
      select: {
        admin_id: true,
        email: true,
        full_name: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Không tìm thấy tài khoản quản trị viên.');
    }

    return {
      adminId: admin.admin_id,
      email: admin.email,
      fullName: admin.full_name,
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at,
      role: 'admin',
    };
  }

  async logout(token: string | null) {
    if (token)
      await prisma.adminSession.deleteMany({
        where: { token_hash: hashAdminToken(token) },
      });
  }

  async setPassword(emailInput: unknown, passwordInput: unknown) {
    const email = normalizeAdminEmail(emailInput);
    const newPassword = validateAdminPassword(passwordInput, true);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    const now = new Date();

    const admin = await prisma.$transaction(async (tx) => {
      const existing = await tx.admin.findUnique({ where: { email } });
      if (!existing)
        throw new NotFoundException('Không tìm thấy tài khoản quản trị viên.');
      const updated = await tx.admin.update({
        where: { email },
        data: {
          password_hash,
          updated_at: now,
          session_version: { increment: 1 },
        },
        select: {
          admin_id: true,
          email: true,
          full_name: true,
          updated_at: true,
        },
      });
      await tx.adminSession.deleteMany({
        where: { admin_id: updated.admin_id },
      });
      return updated;
    });

    return admin;
  }

  async getStats() {
    const [
      totalUsers,
      totalItems,
      pendingRequests,
      activeTransactions,
      recentAdmins,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.item.count().catch(() => 0),
      prisma.borrowRequest
        .count({
          where: { status: 'PENDING' },
        })
        .catch(() => 0),
      prisma.transaction
        .count({
          where: { status: { in: ['PENDING', 'ACCEPTED', 'BORROWED'] } },
        })
        .catch(() => 0),
      prisma.admin.findMany({
        select: {
          admin_id: true,
          email: true,
          full_name: true,
          last_login_at: true,
        },
        orderBy: { admin_id: 'asc' },
      }),
    ]);

    return {
      totalUsers,
      totalItems,
      pendingRequests,
      activeTransactions,
      admins: recentAdmins,
    };
  }
}
