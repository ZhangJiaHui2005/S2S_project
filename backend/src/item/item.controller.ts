import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AllowAnonymous, OptionalAuth, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CreateItemDto } from './dto/create-item.dto.js';
import { QueryItemDto, QueryMineItemDto } from './dto/query-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ItemService } from './item.service.js';

@Controller('api/items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @AllowAnonymous()
  findAll(@Query() query: QueryItemDto) {
    return this.itemService.findAll(query);
  }

  @Get('mine')
  findMine(
    @Session() session: UserSession,
    @Query() query: QueryMineItemDto,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập để thực hiện thao tác này');
    }
    return this.itemService.findMine(session.user.id, query);
  }

  @Get(':id/manage')
  async checkManagePermission(
    @Param('id', ParseIntPipe) id: number,
    @Session() session: UserSession,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập để thực hiện thao tác này');
    }
    const item = await this.itemService.findOne(id, session.user.id);
    if (!item.is_owner) {
      throw new ForbiddenException('Bạn không có quyền quản lý bài đăng này');
    }
    if (item.status !== 'AVAILABLE') {
      throw new ConflictException('Không thể chỉnh sửa bài đăng ở trạng thái này');
    }
    return item;
  }

  @Get(':id')
  @OptionalAuth()
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Session() session?: UserSession,
  ) {
    return this.itemService.findOne(id, session?.user?.id);
  }

  @Post()
  create(
    @Session() session: UserSession,
    @Body() dto: CreateItemDto,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập để thực hiện thao tác này');
    }
    return this.itemService.create(session.user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Session() session: UserSession,
    @Body() dto: UpdateItemDto,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập để thực hiện thao tác này');
    }
    return this.itemService.update(id, session.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Session() session: UserSession,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException('Vui lòng đăng nhập để thực hiện thao tác này');
    }
    await this.itemService.remove(id, session.user.id);
  }
}
