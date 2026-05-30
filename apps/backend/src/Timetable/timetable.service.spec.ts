import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

    it('should throw InternalServerException for timetable not created', async () => {
      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([]),
              }),
            }),
          };

          return cb(mockTx);
        },
      );

      await expect(
        service.createTimetable('user-1', { timetableName: 'testy' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw if eventIds dont exist', async () => {
      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest
                  .fn()
                  .mockResolvedValue([{ timetableID: 1, userID: 'user-1' }]),
              }),
            }), //insert
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([{ eventID: 1 }]),
              }),
            }), //select
          };

          return cb(mockTx);
        },
      );

      await expect(
        service.createTimetable('user-1', {
          timetableName: 'Test',
          eventIds: [1, 2, 3],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create timetable if all events are valid', async () => {
      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: jest
              .fn()
              .mockReturnValueOnce({
                values: jest.fn().mockReturnValue({
                  returning: jest
                    .fn()
                    .mockResolvedValue([{ timetableID: 1, userID: 'user-1' }]),
                }),
              })
              .mockReturnValueOnce({
                values: jest.fn().mockResolvedValue([]),
              }), //insert

            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest
                  .fn()
                  .mockResolvedValue([{ eventID: 1 }, { eventID: 2 }]),
              }),
            }), //select
          };

          return cb(mockTx);
        },
      );

      const timetable = await service.createTimetable('user-1', {
        eventIds: [1, 2],
      });

      expect(timetable.eventIds).toEqual([1, 2]);
    });
  }); //create - done

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
  }); //get all done

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

    it('should return timetable with events with timetable id', async () => {
      const timetable = {
        timetableID: 1,
        userID: 'user-1',
        timetableName: 'Test',
      };

      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { timetable, eventID: 1 },
              { timetable, eventID: 2 },
            ]),
          }),
        }),
      });

      const result = await service.getTimetableById('user-1', 1);
      expect(result.timetable).toEqual(timetable);
      expect(result.eventIds).toEqual([1, 2]);
    });
  });

  describe('updateTimetable', () => {
    it('should throw BadRequestException when no update fields are provided', async () => {
      await expect(service.updateTimetable('user-1', 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if there is o timetable to update', async () => {
      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          };

          return cb(mockTx);
        },
      );

      await expect(
        service.updateTimetable('user-1', 1, { timetableName: 'hallo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update name, and remove event, and add event', async () => {
      const timetable = makeTimetable();
      const newTimetable = makeTimetable({ timetableName: 'newName' });

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          let selectCallCount = 0;

          const mockTx = {
            select: jest.fn().mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return {
                  from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue([timetable]),
                    }),
                  }),
                };
              }

              return {
                from: jest.fn().mockReturnValue({
                  where: jest.fn().mockResolvedValue([{ eventID: 3 }]),
                }),
              };
            }), //select

            update: jest.fn().mockReturnValue({
              set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue([newTimetable]),
                }),
              }),
            }), //udpate

            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                onConflictDoNothing: jest.fn().mockResolvedValue([]),
              }),
            }), //insert

            delete: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          };

          return cb(mockTx);
        },
      );

      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest
              .fn()
              .mockResolvedValue([{ timetable: newTimetable, eventID: 3 }]),
          }),
        }),
      });

      const result = await service.updateTimetable('user-1', 1, {
        timetableName: 'newName',
        addEventIds: [3],
        removeEventIds: [1],
      });

      expect(result.timetable.timetableName).toBe('newName');
      expect(result.eventIds).toEqual([3]);
    });

    it('should throw InternalServerException when timetable not updated', async () => {
      const timetable = makeTimetable();

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([timetable]),
                }),
              }),
            }),

            update: jest.fn().mockReturnValue({
              set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          };

          return cb(mockTx);
        },
      );

      await expect(
        service.updateTimetable('user-1', 1, { timetableName: 'newName' }),
      ).rejects.toThrow(InternalServerErrorException);
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

    it('should delete timetable', async () => {
      const timetable = makeTimetable();

      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([timetable]),
          }),
        }),
      });

      dbService.db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([timetable]),
        }),
      });

      const result = await service.deleteTimetable('user-1', 1);
      expect(result).toEqual({ success: true });
    });

    it('should throw InternalServerException for timetable not deleted', async () => {
      const timetable = makeTimetable();

      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([timetable]),
          }),
        }),
      });

      dbService.db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteTimetable('user-1', 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
