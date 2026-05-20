import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { DatabaseService } from '../db/database.service';

function makeTimetable(overrides: Record<string, unknown> = {}) {
  return {
    timetableID: 1,
    userID: 'user-1',
    timetableName: 'Sem 1',
    ...overrides,
  };
}

describe('TimetableService', () => {
  let service: TimetableService;
  let dbService: { db: jest.Mocked<any> };

  beforeEach(async () => {
    dbService = {
      db: {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        transaction: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableService,
        { provide: DatabaseService, useValue: dbService },
      ],
    }).compile();

    service = module.get<TimetableService>(TimetableService);
  });

  describe('createTimetable', () => {
    it('should create a timetable and return it without eventIds when none provided', async () => {
      const newTimetable = makeTimetable();

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([newTimetable]),
              }),
            }),
          };
          return cb(mockTx);
        },
      );

      const result = await service.createTimetable('user-1', {
        timetableName: 'Sem 1',
      });

      expect(result.timetable).toEqual(newTimetable);
      expect(result.eventIds).toBeUndefined();
    });
  });

  describe('getAllTimetables', () => {
    it('should return timetables with their linked eventIds grouped correctly', async () => {
      const rows = [
        { timetable: makeTimetable({ timetableID: 1 }), eventID: 10 },
        { timetable: makeTimetable({ timetableID: 1 }), eventID: 11 },
        { timetable: makeTimetable({ timetableID: 2 }), eventID: null },
      ];

      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(rows),
          }),
        }),
      });

      const result = await service.getAllTimetables('user-1');

      expect(result.timetables).toHaveLength(2);
      expect(result.timetables[0].eventIds).toEqual([10, 11]);
      expect(result.timetables[1].eventIds).toBeUndefined();
    });
  });

  describe('getTimetableById', () => {
    it('should throw NotFoundException when timetable does not exist', async () => {
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.getTimetableById('user-1', 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTimetable', () => {
    it('should throw BadRequestException when no update fields are provided', async () => {
      await expect(service.updateTimetable('user-1', 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteTimetable', () => {
    it('should throw NotFoundException when timetable does not exist', async () => {
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.deleteTimetable('user-1', 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
