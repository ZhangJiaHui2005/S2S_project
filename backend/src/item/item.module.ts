import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ItemController } from './item.controller.js';
import { ItemService } from './item.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
