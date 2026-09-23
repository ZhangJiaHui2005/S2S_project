import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard.js';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('api/categories')
@AllowAnonymous()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @UseGuards(AdminJwtGuard)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
  }
}
