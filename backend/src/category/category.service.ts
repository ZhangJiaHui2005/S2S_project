import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await prisma.category.create({
        data: {
          name: createCategoryDto.name.trim(),
          icon: createCategoryDto.icon?.trim() || null,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll() {
    try {
      return await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },

        include: {
          _count: {
            select: {
              Item: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findOne(id: number) {
    try {
      const category = await prisma.category.findUnique({
        where: {
          category_id: id,
        },

        include: {
          _count: {
            select: {
              Item: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException(
          'Cannot find category with id: ' + id.toString(),
        );
      }

      return category;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    try {
      return await prisma.category.update({
        where: {
          category_id: id,
        },
        data: {
          ...(updateCategoryDto.name !== undefined && {
            name: updateCategoryDto.name.trim(),
          }),
          ...(updateCategoryDto.icon !== undefined && {
            icon: updateCategoryDto.icon.trim() || null,
          }),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    try {
      if (category._count.Item > 0) {
        throw new ConflictException(
          'Không thể xóa danh mục đang chứa sản phẩm.',
        );
      }

      await prisma.category.delete({
        where: {
          category_id: id,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Tên danh mục đã tồn tại.');
    }

    throw error;
  }
}
