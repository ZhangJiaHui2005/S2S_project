import {
  BadRequestException,
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
import { AdminJwtGuard, type AdminJwtPayload } from './guards/admin-jwt.guard.js';

interface RequestWithAdmin extends Request {
  admin?: AdminJwtPayload;
}

@Controller('api/admin')
@AllowAnonymous()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      throw new BadRequestException('Vui lòng nhập đầy đủ email và mật khẩu quản trị.');
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
      token,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('s2s_admin_token', {
      httpOnly: true,
      sameSite: 'lax',
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
    @Body() body: { email?: string; newPassword?: string },
  ) {
    const targetEmail = body?.email ?? req.admin?.email;
    const newPassword = body?.newPassword;

    if (!targetEmail || !newPassword) {
      throw new BadRequestException('Vui lòng cung cấp mật khẩu mới cần đổi.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }

    const updated = await this.adminService.setPassword(targetEmail, newPassword);
    return {
      success: true,
      message: `Đổi mật khẩu cho quản trị viên ${updated.email} thành công.`,
    };
  }
}
