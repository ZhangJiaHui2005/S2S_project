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

  async login(emailInput: string, passwordInput: string) {
    const email = emailInput.trim().toLowerCase();
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new UnauthorizedException('Email quản trị hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(passwordInput, admin.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email quản trị hoặc mật khẩu không chính xác.');
    }

    // Update last_login_at
    const now = new Date();
    await prisma.admin.update({
      where: { admin_id: admin.admin_id },
      data: {
        last_login_at: now,
        updated_at: now,
      },
    });

    const payload: AdminJwtPayload = {
      adminId: admin.admin_id,
      email: admin.email,
      fullName: admin.full_name,
      role: 'admin',
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '7d',
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

  async setPassword(emailInput: string, newPassword: string) {
    const email = emailInput.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    const now = new Date();

    const admin = await prisma.admin.update({
      where: { email },
      data: {
        password_hash,
        updated_at: now,
      },
      select: {
        admin_id: true,
        email: true,
        full_name: true,
        updated_at: true,
      },
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
