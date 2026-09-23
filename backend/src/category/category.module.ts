import { Module } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import { AdminModule } from '../admin/admin.module.js';

@Module({
  imports: [AdminModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
