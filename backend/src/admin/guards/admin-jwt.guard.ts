import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma.js';
import { extractAdminToken, hashAdminToken } from '../admin-token.js';

export interface AdminJwtPayload {
  adminId: number;
  email: string;
  fullName: string;
  role: 'admin';
  version: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AdminJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractAdminToken(request);
    const invalid = () =>
      new UnauthorizedException(
        'Phiên đăng nhập quản trị không hợp lệ hoặc đã hết hạn.',
      );
    if (!token) throw invalid();
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) throw new Error('JWT_SECRET chưa được cấu hình.');

    let decoded: jwt.JwtPayload;
    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string') throw invalid();
      decoded = payload;
    } catch {
      throw invalid();
    }
    if (
      decoded.role !== 'admin' ||
      !Number.isInteger(decoded.adminId) ||
      !Number.isInteger(decoded.version) ||
      typeof decoded.exp !== 'number'
    )
      throw invalid();

    const session = await prisma.adminSession.findUnique({
      where: { token_hash: hashAdminToken(token) },
      include: { admin: true },
    });
    if (
      !session ||
      session.expires_at <= new Date() ||
      session.admin_id !== decoded.adminId ||
      session.version !== decoded.version ||
      session.admin.session_version !== decoded.version
    )
      throw invalid();

    request.admin = {
      adminId: session.admin_id,
      email: session.admin.email,
      fullName: session.admin.full_name,
      role: 'admin',
      version: session.version,
    } satisfies AdminJwtPayload;
    return true;
  }
}
