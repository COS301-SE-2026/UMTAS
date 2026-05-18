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
    id: 'module-id',
    code: 'COS332',
    name: 'Computer Networks',
    description: 'Networks module',
    styling: '#3B82F6',
    userId: 'user-id',
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
        description: 'Networks module',
        styling: '#3B82F6',
        userId: 'user-id',
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
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate module code', async () => {
      mockSelectResult([mockModule]);

      await expect(
        service.create({
          code: 'COS332',
          name: 'Computer Networks',
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
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getAll', () => {
    it('should return all modules', async () => {
      mockSelectAllResult([mockModule]);

      await expect(service.getAll()).resolves.toEqual({
        modules: [mockModule],
      });
    });
  });

  describe('get by id', () => {
    it('should return one module', async () => {
      mockSelectResult([mockModule]);

      await expect(service.getById('module-id')).resolves.toEqual({
        module: mockModule,
      });
    });

    it('should throw if module is not found', async () => {
      mockSelectResult([]);

      await expect(service.getById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a module', async () => {
      mockSelectResult([mockModule]);
      mockUpdateResult([{ ...mockModule, name: 'Updated Networks' }]);

      await expect(
        service.update('module-id', {
          name: 'Updated Networks',
        }),
      ).resolves.toEqual({
        module: { ...mockModule, name: 'Updated Networks' },
      });
    });

    it('should throw if module does not exist', async () => {
      mockSelectResult([]);

      await expect(
        service.update('missing-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
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
              limit: jest
                .fn()
                .mockResolvedValue([
                  { ...mockModule, id: 'other-id', code: 'COS301' },
                ]),
            }),
          }),
        });

      await expect(
        service.update('module-id', { code: 'COS301' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a module', async () => {
      mockSelectResult([mockModule]);
      mockDeleteResult();

      await expect(service.deleteById('module-id')).resolves.toEqual({
        success: true,
      });
    });

    it('should throw if module does not exist', async () => {
      mockSelectResult([]);

      await expect(service.deleteById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
