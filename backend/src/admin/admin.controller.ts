import { AdminLoginLimiter } from './admin-login-limiter.js';
import { extractAdminToken } from './admin-token.js';
import {
  normalizeAdminEmail,
  validateAdminPassword,
} from './admin-validation.js';
import {
  HttpException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import {
  AdminJwtGuard,
  type AdminJwtPayload,
} from './guards/admin-jwt.guard.js';

interface RequestWithAdmin extends Request {
  admin?: AdminJwtPayload;
}

@Controller('api/admin')
@AllowAnonymous()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly loginLimiter: AdminLoginLimiter,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email?: unknown; password?: unknown } | null,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const email = normalizeAdminEmail(body?.email);
    const password = validateAdminPassword(body?.password);
    const retryAfter = await this.loginLimiter.consume(
      email,
      req.ip ?? req.socket.remoteAddress ?? 'unknown',
    );
    if (retryAfter) {
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const { token, admin } = await this.adminService.login(email, password);

    // Set HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('s2s_admin_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      message: 'Đăng nhập quản trị viên thành công.',
      admin,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.adminService.logout(extractAdminToken(req));
    res.clearCookie('s2s_admin_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return {
      success: true,
      message: 'Đã đăng xuất quản trị viên thành công.',
    };
  }

  @Get('me')
  @UseGuards(AdminJwtGuard)
  async getMe(@Req() req: RequestWithAdmin) {
    if (!req.admin) {
      return { success: false, admin: null };
    }
    const profile = await this.adminService.getProfile(req.admin.adminId);
    return {
      success: true,
      admin: profile,
    };
  }

  @Get('stats')
  @UseGuards(AdminJwtGuard)
  async getStats() {
    const stats = await this.adminService.getStats();
    return {
      success: true,
      stats,
    };
  }

  @Post('set-password')
  @UseGuards(AdminJwtGuard)
  async setPassword(
    @Req() req: RequestWithAdmin,
    @Body() body: { email?: unknown; newPassword?: unknown } | null,
    @Res({ passthrough: true }) res: Response,
  ) {
    const targetEmail = normalizeAdminEmail(body?.email ?? req.admin?.email);
    const newPassword = validateAdminPassword(body?.newPassword, true);

    const updated = await this.adminService.setPassword(
      targetEmail,
      newPassword,
    );
    const requiresLogin = updated.admin_id === req.admin?.adminId;
    if (requiresLogin) {
      res.clearCookie('s2s_admin_token', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return {
      success: true,
      requiresLogin,
      message: `Đổi mật khẩu cho quản trị viên ${updated.email} thành công.`,
    };
  }
}
