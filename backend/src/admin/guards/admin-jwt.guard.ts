import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { parseCookie } from 'cookie';
import jwt from 'jsonwebtoken';

export interface AdminJwtPayload {
  adminId: number;
  email: string;
  fullName: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

@Injectable()
export class AdminJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Chưa đăng nhập quyền quản trị (Admin).');
    }

    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      throw new Error('JWT_SECRET chưa được cấu hình.');
    }

    try {
      const decoded = jwt.verify(token, secret) as AdminJwtPayload;
      request.admin = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập quản trị không hợp lệ hoặc đã hết hạn.');
    }
  }

  private extractToken(request: any): string | null {
    // 1. Check Authorization Bearer Header
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Check Cookie Header
    const cookieHeader = request.headers?.cookie;
    if (cookieHeader) {
      const parsed = parseCookie(cookieHeader);
      if (parsed.s2s_admin_token) {
        return parsed.s2s_admin_token;
      }
    }

    return null;
  }
}
