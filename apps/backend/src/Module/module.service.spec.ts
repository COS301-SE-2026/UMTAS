import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ModuleService } from './module.service';
import { DatabaseService } from '../db/database.service';

describe('ModuleService', () => {
  let service: ModuleService;

  const mockDb = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDatabaseService = {
    db: mockDb,
  } as unknown as DatabaseService;

  const mockModule = {
    moduleID: 1,
    moduleCode: 'COS332',
    moduleName: 'Computer Networks',
    moduleDescription: 'Networks module',
    styling: '#3B82F6',
    userID: '550e8400-e29b-41d4-a716-446655440000',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModuleService(mockDatabaseService);
  });

  function mockSelectResult(result: unknown[]) {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(result),
        }),
      }),
    });
  }

  function mockSelectAllResult(result: unknown[]) {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockResolvedValue(result),
    });
  }

  function mockInsertResult(result: unknown[]) {
    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(result),
      }),
    });
  }

  function mockUpdateResult(result: unknown[]) {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(result),
        }),
      }),
    });
  }

  function mockDeleteResult() {
    mockDb.delete.mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });
  }
  //Create
  describe('create', () => {
    it('should create a module', async () => {
      mockSelectResult([]);
      mockInsertResult([mockModule]);

      const result = await service.create({
        code: 'cos332',
        name: 'Computer Networks',
        styling: '#3B82F6',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toEqual({ module: mockModule });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should reject missing code or name', async () => {
      await expect(
        service.create({
          code: '',
          name: '',
          userId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing userId', async () => {
      await expect(
        service.create({
          code: 'COS332',
          name: 'Computer Networks',
          styling: '#3B82F6',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate module code', async () => {
      mockSelectResult([mockModule]);

      await expect(
        service.create({
          code: 'COS332',
          name: 'Computer Networks',
          userId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if insert returns nothing', async () => {
      mockSelectResult([]);
      mockInsertResult([]);

      await expect(
        service.create({
          code: 'COS332',
          name: 'Computer Networks',
          userId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  //getAll
  describe('getAll', () => {
    it('should return all modules', async () => {
      mockSelectAllResult([mockModule]);

      await expect(service.getAll()).resolves.toEqual({
        modules: [mockModule],
      });
    });
  });

  //getById
  describe('getById', () => {
    it('should return one module', async () => {
      mockSelectResult([mockModule]);

      await expect(service.getById(1)).resolves.toEqual({
        module: mockModule,
      });
    });

    it('should throw if module is not found', async () => {
      mockSelectResult([]);

      await expect(service.getById(999)).rejects.toThrow(NotFoundException);
    });
  });

  //Update
  describe('update', () => {
    it('should update a module', async () => {
      mockSelectResult([mockModule]);
      mockUpdateResult([{ ...mockModule, moduleName: 'Updated Networks' }]);

      await expect(
        service.update(1, {
          name: 'Updated Networks',
        }),
      ).resolves.toEqual({
        module: { ...mockModule, moduleName: 'Updated Networks' },
      });
    });

    it('should reject empty update payload', async () => {
      mockSelectResult([mockModule]);

      await expect(service.update(1, {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if module does not exist', async () => {
      mockSelectResult([]);

      await expect(service.update(999, { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject duplicate updated code', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockModule]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                {
                  ...mockModule,
                  moduleID: 2,
                  moduleCode: 'COS301',
                },
              ]),
            }),
          }),
        });

      await expect(service.update(1, { code: 'COS301' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  //deleteById
  describe('deleteById', () => {
    it('should remove a module', async () => {
      mockSelectResult([mockModule]);
      mockDeleteResult();

      await expect(service.deleteById(1)).resolves.toEqual({
        success: true,
      });
    });

    it('should throw if module does not exist', async () => {
      mockSelectResult([]);

      await expect(service.deleteById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
