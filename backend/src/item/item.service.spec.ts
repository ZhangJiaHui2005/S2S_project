import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ItemType } from './dto/create-item.dto.js';

describe('ItemService', () => {
  let service: ItemService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    item: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    borrowRequest: {
      count: vi.fn(),
    },
    transaction: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should throw BadRequestException if minPriceVnd > maxPriceVnd', async () => {
      await expect(
        service.findAll({ minPriceVnd: 50000, maxPriceVnd: 10000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should query items with filters and pagination', async () => {
      mockPrismaService.item.count.mockResolvedValue(1);
      mockPrismaService.item.findMany.mockResolvedValue([
        { item_id: 1, title: 'Item 1', status: 'AVAILABLE', price_vnd: 50000, price_confirmed: true },
      ]);

      const result = await service.findAll({
        q: 'Item',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: [{ item_id: 1, title: 'Item 1', status: 'AVAILABLE', price_vnd: 50000, price_confirmed: true }],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(mockPrismaService.item.count).toHaveBeenCalled();
      expect(mockPrismaService.item.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create('unknown-auth-id', {
          type: ItemType.SELL,
          title: 'Test',
          category_id: 1,
          price_vnd: 10000,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if category not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create('valid-auth-id', {
          type: ItemType.SELL,
          title: 'Test Item',
          category_id: 99,
          price_vnd: 20000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create item successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.category.findUnique.mockResolvedValue({ category_id: 1, name: 'Sách' });
      mockPrismaService.item.create.mockResolvedValue({
        item_id: 100,
        owner_id: 10,
        category_id: 1,
        title: 'Test Item',
        type: ItemType.SELL,
        price_vnd: 20000,
        price_confirmed: true,
        status: 'AVAILABLE',
      });

      const result = await service.create('valid-auth-id', {
        type: ItemType.SELL,
        title: 'Test Item',
        category_id: 1,
        price_vnd: 20000,
      });

      expect(result.item_id).toBe(100);
      expect(mockPrismaService.item.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update item title without setting price_confirmed', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.category.findUnique.mockResolvedValue({ category_id: 1 });
      mockPrismaService.item.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        title: 'Updated title',
        owner_id: 10,
        status: 'AVAILABLE',
      });

      const result = await service.update(100, 'valid-auth-id', {
        title: 'Updated title',
      });

      expect(result?.title).toBe('Updated title');
      expect(mockPrismaService.item.updateMany).toHaveBeenCalledWith({
        where: { item_id: 100, owner_id: 10, status: 'AVAILABLE' },
        data: expect.objectContaining({ title: 'Updated title' }),
      });
    });

    it('should confirm price only when price_vnd is explicitly provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        title: 'Updated price',
        owner_id: 10,
        status: 'AVAILABLE',
        price_confirmed: true,
        price_vnd: 50000,
      });

      const result = await service.update(100, 'valid-auth-id', {
        price_vnd: 50000,
      });

      expect(result?.price_vnd).toBe(50000);
      expect(mockPrismaService.item.updateMany).toHaveBeenCalledWith({
        where: { item_id: 100, owner_id: 10, status: 'AVAILABLE' },
        data: expect.objectContaining({ price_vnd: 50000, price_confirmed: true }),
      });
    });

    it('should throw ConflictException if item is no longer AVAILABLE during update', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        owner_id: 10,
        status: 'LOCKED',
      });

      await expect(
        service.update(100, 'valid-auth-id', { title: 'New title' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should throw ConflictException if item has active borrow requests', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        owner_id: 10,
        status: 'AVAILABLE',
      });
      mockPrismaService.borrowRequest.count.mockResolvedValue(1);
      mockPrismaService.transaction.count.mockResolvedValue(0);

      await expect(service.remove(100, 'valid-auth-id')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if item has active transactions', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        owner_id: 10,
        status: 'AVAILABLE',
      });
      mockPrismaService.borrowRequest.count.mockResolvedValue(0);
      mockPrismaService.transaction.count.mockResolvedValue(1);

      await expect(service.remove(100, 'valid-auth-id')).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        owner_id: 999,
        status: 'AVAILABLE',
      });

      await expect(service.remove(100, 'valid-auth-id')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if item is not in AVAILABLE status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        owner_id: 10,
        status: 'LOCKED',
      });

      await expect(service.remove(100, 'valid-auth-id')).rejects.toThrow(ConflictException);
    });

    it('should soft delete item if valid owner and status is AVAILABLE', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ user_id: 10 });
      mockPrismaService.item.findUnique.mockResolvedValue({
        item_id: 100,
        owner_id: 10,
        status: 'AVAILABLE',
      });
      mockPrismaService.borrowRequest.count.mockResolvedValue(0);
      mockPrismaService.transaction.count.mockResolvedValue(0);
      mockPrismaService.item.updateMany.mockResolvedValue({ count: 1 });

      await service.remove(100, 'valid-auth-id');

      expect(mockPrismaService.item.updateMany).toHaveBeenCalledWith({
        where: { item_id: 100, owner_id: 10, status: 'AVAILABLE' },
        data: expect.objectContaining({ status: 'DELETED' }),
      });
    });
  });
});
