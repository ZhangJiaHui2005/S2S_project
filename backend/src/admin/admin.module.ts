import { AdminLoginLimiter } from './admin-login-limiter.js';
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminJwtGuard } from './guards/admin-jwt.guard.js';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminJwtGuard, AdminLoginLimiter],
  exports: [AdminService, AdminJwtGuard],
})
export class AdminModule {}
