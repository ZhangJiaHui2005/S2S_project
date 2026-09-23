import { Test, TestingModule } from '@nestjs/testing';
import { ItemController } from './item.controller.js';
import { ItemService } from './item.service.js';
import { ItemType } from './dto/create-item.dto.js';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('ItemController', () => {
  let controller: ItemController;
  let service: ItemService;

  const mockItemService = {
    findAll: vi.fn(),
    findMine: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [
        {
          provide: ItemService,
          useValue: mockItemService,
        },
      ],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    service = module.get<ItemService>(ItemService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockItemService.findAll.mockResolvedValue({ data: [], page: 1, limit: 12, total: 0, totalPages: 1 });
      const query = { page: 1, limit: 12 };
      const res = await controller.findAll(query);
      expect(res).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('checkManagePermission', () => {
    it('should throw UnauthorizedException if session is missing', async () => {
      await expect(controller.checkManagePermission(1, {} as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockItemService.findOne.mockResolvedValue({ item_id: 1, is_owner: false });
      const session = { user: { id: 'other-user' } } as any;
      await expect(controller.checkManagePermission(1, session)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return item if user is owner and status is AVAILABLE', async () => {
      mockItemService.findOne.mockResolvedValue({ item_id: 1, is_owner: true, status: 'AVAILABLE' });
      const session = { user: { id: 'owner-user' } } as any;
      const res = await controller.checkManagePermission(1, session);
      expect(res).toEqual({ item_id: 1, is_owner: true, status: 'AVAILABLE' });
    });

    it('should throw ConflictException if item status is not AVAILABLE', async () => {
      mockItemService.findOne.mockResolvedValue({ item_id: 1, is_owner: true, status: 'LOCKED' });
      const session = { user: { id: 'owner-user' } } as any;
      await expect(controller.checkManagePermission(1, session)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('create', () => {
    it('should throw UnauthorizedException if session has no user', () => {
      const dto = {
        type: ItemType.SELL,
        title: 'Title',
        category_id: 1,
        price_vnd: 10000,
      };
      expect(() => controller.create({} as any, dto)).toThrow(UnauthorizedException);
    });

    it('should call service.create with session user id', async () => {
      mockItemService.create.mockResolvedValue({ item_id: 1, title: 'Title' });
      const session = { user: { id: 'user-auth-123' } } as any;
      const dto = {
        type: ItemType.SELL,
        title: 'Title',
        category_id: 1,
        price_vnd: 10000,
      };
      const res = await controller.create(session, dto);
      expect(res).toEqual({ item_id: 1, title: 'Title' });
      expect(service.create).toHaveBeenCalledWith('user-auth-123', dto);
    });
  });

  describe('update', () => {
    it('should throw UnauthorizedException if session has no user', () => {
      expect(() => controller.update(1, {} as any, { title: 'New' })).toThrow(
        UnauthorizedException,
      );
    });

    it('should call service.update with session user id', async () => {
      mockItemService.update.mockResolvedValue({ item_id: 1, title: 'New' });
      const session = { user: { id: 'user-auth-123' } } as any;
      const res = await controller.update(1, session, { title: 'New' });
      expect(res).toEqual({ item_id: 1, title: 'New' });
      expect(service.update).toHaveBeenCalledWith(1, 'user-auth-123', { title: 'New' });
    });
  });

  describe('remove', () => {
    it('should throw UnauthorizedException if session has no user', async () => {
      await expect(controller.remove(1, {} as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should call service.remove with session user id', async () => {
      const session = { user: { id: 'user-auth-123' } } as any;
      await controller.remove(1, session);
      expect(service.remove).toHaveBeenCalledWith(1, 'user-auth-123');
    });
  });
});
