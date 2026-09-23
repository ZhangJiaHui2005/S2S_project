import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { QueryItemDto, QueryMineItemDto, SortOption } from './dto/query-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDomainUserByAuthId(authUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { auth_user_id: authUserId },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản chưa được liên kết trong hệ thống');
    }
    return user;
  }

  private cleanItemPayload<T extends { karma_value?: number | null; price_confirmed?: boolean; price_vnd?: number | null }>(
    item: T,
  ): Omit<T, 'karma_value'> {
    const { karma_value: _k, ...rest } = item;
    return {
      ...rest,
      // If price has not been confirmed in VND by the user, do not return fake price
      price_vnd: rest.price_confirmed ? rest.price_vnd : null,
    };
  }

  async findAll(query: QueryItemDto) {
    const {
      q,
      categoryId,
      type,
      minPriceVnd,
      maxPriceVnd,
      sort = SortOption.NEWEST,
      page = 1,
      limit = 12,
    } = query;

    if (
      minPriceVnd !== undefined &&
      maxPriceVnd !== undefined &&
      minPriceVnd > maxPriceVnd
    ) {
      throw new BadRequestException('Giá tối thiểu không được lớn hơn giá tối đa');
    }

    const where: Prisma.ItemWhereInput = {
      status: 'AVAILABLE',
      price_confirmed: true,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId !== undefined) {
      where.category_id = categoryId;
    }

    if (type !== undefined) {
      where.type = type;
    }

    if (minPriceVnd !== undefined || maxPriceVnd !== undefined) {
      where.price_vnd = {};
      if (minPriceVnd !== undefined) {
        where.price_vnd.gte = minPriceVnd;
      }
      if (maxPriceVnd !== undefined) {
        where.price_vnd.lte = maxPriceVnd;
      }
    }

    let orderBy: Prisma.ItemOrderByWithRelationInput[];
    if (sort === SortOption.PRICE_ASC) {
      orderBy = [{ price_vnd: 'asc' }, { item_id: 'desc' }];
    } else if (sort === SortOption.PRICE_DESC) {
      orderBy = [{ price_vnd: 'desc' }, { item_id: 'desc' }];
    } else {
      orderBy = [{ created_at: 'desc' }, { item_id: 'desc' }];
    }

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          item_id: true,
          owner_id: true,
          category_id: true,
          title: true,
          description: true,
          price_vnd: true,
          price_confirmed: true,
          type: true,
          status: true,
          location: true,
          image_url: true,
          created_at: true,
          updated_at: true,
          Category: {
            select: {
              category_id: true,
              name: true,
              icon: true,
            },
          },
          User: {
            select: {
              user_id: true,
              full_name: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: data.map((item) => this.cleanItemPayload(item)),
      page,
      limit,
      total,
      totalPages,
    };
  }

  async findMine(authUserId: string, query: QueryMineItemDto) {
    const user = await this.getDomainUserByAuthId(authUserId);
    const { page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {
      owner_id: user.user_id,
      status: { not: 'DELETED' },
    };

    const [total, data] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { item_id: 'desc' }],
        skip,
        take: limit,
        select: {
          item_id: true,
          owner_id: true,
          category_id: true,
          title: true,
          description: true,
          price_vnd: true,
          price_confirmed: true,
          type: true,
          status: true,
          location: true,
          image_url: true,
          created_at: true,
          updated_at: true,
          Category: {
            select: {
              category_id: true,
              name: true,
              icon: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: data.map((item) => this.cleanItemPayload(item)),
      page,
      limit,
      total,
      totalPages,
    };
  }

  async findOne(id: number, authUserId?: string) {
    const item = await this.prisma.item.findUnique({
      where: { item_id: id },
      include: {
        Category: {
          select: {
            category_id: true,
            name: true,
            icon: true,
          },
        },
        User: {
          select: {
            user_id: true,
            full_name: true,
            avatar: true,
          },
        },
      },
    });

    if (!item || item.status === 'DELETED') {
      throw new NotFoundException('Vật phẩm không tồn tại');
    }

    let isOwner = false;
    if (authUserId) {
      const user = await this.prisma.user.findUnique({
        where: { auth_user_id: authUserId },
      });
      if (user && user.user_id === item.owner_id) {
        isOwner = true;
      }
    }

    // Non-AVAILABLE or unconfirmed items can only be viewed by owner
    if ((item.status !== 'AVAILABLE' || !item.price_confirmed) && !isOwner) {
      throw new NotFoundException('Vật phẩm không tồn tại');
    }

    return {
      ...this.cleanItemPayload(item),
      is_owner: isOwner,
    };
  }

  async create(authUserId: string, dto: CreateItemDto) {
    const user = await this.getDomainUserByAuthId(authUserId);

    const category = await this.prisma.category.findUnique({
      where: { category_id: dto.category_id },
    });
    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại');
    }

    const created = await this.prisma.item.create({
      data: {
        owner_id: user.user_id,
        category_id: dto.category_id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        type: dto.type,
        price_vnd: dto.price_vnd,
        price_confirmed: true,
        location: dto.location?.trim() || null,
        image_url: dto.image_url?.trim() || null,
        status: 'AVAILABLE',
        updated_at: new Date(),
      },
      include: {
        Category: {
          select: {
            category_id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return this.cleanItemPayload(created);
  }

  async update(id: number, authUserId: string, dto: UpdateItemDto) {
    const user = await this.getDomainUserByAuthId(authUserId);

    if (dto.category_id !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { category_id: dto.category_id },
      });
      if (!category) {
        throw new BadRequestException('Danh mục không tồn tại');
      }
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim() || null;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.category_id !== undefined) updateData.category_id = dto.category_id;
    if (dto.location !== undefined) updateData.location = dto.location?.trim() || null;
    if (dto.image_url !== undefined) updateData.image_url = dto.image_url?.trim() || null;

    // Only confirm price if price_vnd is explicitly provided in this update request
    if (dto.price_vnd !== undefined && dto.price_vnd !== null) {
      updateData.price_vnd = dto.price_vnd;
      updateData.price_confirmed = true;
    }

    // Atomic conditional update on status === 'AVAILABLE' and owner_id === user.user_id
    const result = await this.prisma.item.updateMany({
      where: {
        item_id: id,
        owner_id: user.user_id,
        status: 'AVAILABLE',
      },
      data: updateData,
    });

    if (result.count === 0) {
      const current = await this.prisma.item.findUnique({ where: { item_id: id } });
      if (!current || current.status === 'DELETED') {
        throw new NotFoundException('Vật phẩm không tồn tại');
      }
      if (current.owner_id !== user.user_id) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài đăng này');
      }
      throw new ConflictException('Không thể chỉnh sửa bài đăng ở trạng thái này');
    }

    const updated = await this.prisma.item.findUnique({
      where: { item_id: id },
      include: {
        Category: {
          select: {
            category_id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return updated ? this.cleanItemPayload(updated) : null;
  }

  async remove(id: number, authUserId: string) {
    const user = await this.getDomainUserByAuthId(authUserId);

    // Conditional update resolves two simultaneous DELETE calls. A future API
    // that creates requests/transactions must coordinate against this item row.
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.item.findUnique({
        where: { item_id: id },
      });

      if (!current || current.status === 'DELETED') {
        throw new NotFoundException('Vật phẩm không tồn tại');
      }

      if (current.owner_id !== user.user_id) {
        throw new ForbiddenException('Bạn không có quyền xóa bài đăng này');
      }

      if (current.status !== 'AVAILABLE') {
        throw new ConflictException('Không thể xóa bài đăng ở trạng thái này');
      }

      const [activeRequests, activeTransactions] = await Promise.all([
        tx.borrowRequest.count({
          where: {
            item_id: id,
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
        }),
        tx.transaction.count({
          where: {
            item_id: id,
            status: { in: ['PENDING', 'ACCEPTED', 'ACTIVE'] },
          },
        }),
      ]);

      if (activeRequests > 0 || activeTransactions > 0) {
        throw new ConflictException('Không thể xóa bài đăng đang có yêu cầu hoặc giao dịch xử lý');
      }

      const result = await tx.item.updateMany({
        where: {
          item_id: id,
          owner_id: user.user_id,
          status: 'AVAILABLE',
        },
        data: {
          status: 'DELETED',
          updated_at: new Date(),
        },
      });

      if (result.count === 0) {
        throw new ConflictException('Không thể xóa bài đăng ở trạng thái này');
      }
    });
  }
}
