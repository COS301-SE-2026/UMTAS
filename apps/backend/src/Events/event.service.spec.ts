import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventService } from './event.service';
import { DatabaseService } from '../db/database.service';
import {
  EventType,
  EventCriteriaDto,
  CreateEventDto,
} from './dto/EventDto.dto';

// Mock factoris - helpers for test data
function makeEventCriteria(
  overrides: Partial<EventCriteriaDto> = {},
): EventCriteriaDto {
  return {
    type: undefined,
    day: 'Monday',
    startTime: '08:30',
    endTime: '10:20',
    ...overrides,
  };
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventID: 1,
    userID: 'user-1',
    eventCriteria: makeEventCriteria(),
    ...overrides,
  };
}

function makeLecture(overrides: Record<string, unknown> = {}) {
  return {
    lectureID: 10,
    eventID: 1,
    moduleID: 99,
    venue: 'Room A',
    ...overrides,
  };
}

function makeModule() {
  return { moduleID: 99, moduleCode: 'CS101' };
}

describe('EventService', () => {
  let service: EventService;
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
        EventService,
        { provide: DatabaseService, useValue: dbService },
      ],
    }).compile();
    service = module.get<EventService>(EventService);
  });

  describe('createEvent', () => {
    it('shold throw BadRequestException for invalid input', async () => {
      await expect(
        service.createEvent('', { eventCriteria: makeEventCriteria() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when LECTURE type lacks moduleCode', async () => {
      const dto: CreateEventDto = {
        eventCriteria: makeEventCriteria({ type: EventType.LECTURE }),
      };
      await expect(service.createEvent('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create generic event successfully', async () => {
      const newEvent = makeEvent();
      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          // setup mock tx for insert
          const mckTx = {
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([newEvent]),
              }),
            }),
          };
          return cb(mckTx);
        },
      );

      const dto: CreateEventDto = { eventCriteria: makeEventCriteria() };
      const result = await service.createEvent('user-1', dto);
      expect(result.event).toEqual(newEvent);
    });

    it('should throw InternalServerErrorException on faild insert', async () => {
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

      const dto: CreateEventDto = { eventCriteria: makeEventCriteria() };
      await expect(service.createEvent('user-1', dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should create LECTURE event with module lookup', async () => {
      const newEvent = makeEvent({
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'CS101',
        }),
      });
      const lecture = makeLecture();

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: jest
              .fn()
              .mockReturnValueOnce({
                values: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue([newEvent]),
                }),
              })
              .mockReturnValueOnce({
                values: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue([lecture]),
                }),
              }),
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([makeModule()]),
                }),
              }),
            }),
          };
          return cb(mockTx);
        },
      );

      const dto: CreateEventDto = {
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'CS101',
        }),
      };
      const result = await service.createEvent('user-1', dto);
      expect(result.lecture).toEqual(lecture);
    });

    it('should throw NotFoundException when module not found', async () => {
      const newEvent = makeEvent({
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'UNKNOWN',
        }),
      });

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([newEvent]),
              }),
            }),
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

      const dto: CreateEventDto = {
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'UNKNOWN',
        }),
      };
      await expect(service.createEvent('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllEvents', () => {
    it('should retrun events list', async () => {
      const rows = [
        { event: makeEvent({ eventID: 1 }), lecture: makeLecture() },
        { event: makeEvent({ eventID: 2 }), lecture: null },
      ];
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(rows),
          }),
        }),
      });

      const result = await service.getAllEvents('user-1');
      expect(result.events).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should throw NotFoundException when event not found', async () => {
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await expect(service.getById('user-1', 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return event with lecture', async () => {
      const row = { event: makeEvent(), lecture: makeLecture() };
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([row]),
            }),
          }),
        }),
      });

      const result = await service.getById('user-1', 1);
      expect(result.lecture).toEqual(row.lecture);
    });
  });

  describe('updateEvent', () => {
    it('should throw BadRequestException for missing eventCriteria', async () => {
      await expect(service.updateEvent('user-1', 1, {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundExeception when event not found', async () => {
      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                  }),
                }),
              }),
            }),
          };
          return cb(mockTx);
        },
      );

      await expect(
        service.updateEvent('user-1', 1, {
          eventCriteria: { venue: 'Hall B' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update event successfuly', async () => {
      const existingEvent = makeEvent();
      const updatedEvent = makeEvent({
        eventCriteria: makeEventCriteria({ venue: 'Lab 2' }),
      });

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    limit: jest
                      .fn()
                      .mockResolvedValue([
                        { event: existingEvent, lecture: null },
                      ]),
                  }),
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue([updatedEvent]),
                }),
              }),
            }),
            delete: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          };
          return cb(mockTx);
        },
      );

      const result = await service.updateEvent('user-1', 1, {
        eventCriteria: { venue: 'Lab 2' },
      });
      expect(result.event).toEqual(updatedEvent);
    });

    it('should throw InternalServerErrorException on failed update', async () => {
      const existingEvent = makeEvent();

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                leftJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    limit: jest
                      .fn()
                      .mockResolvedValue([
                        { event: existingEvent, lecture: null },
                      ]),
                  }),
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
        service.updateEvent('user-1', 1, {
          eventCriteria: { venue: 'Somewhere' },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteEvnt', () => {
    it('should throw NotFoundException when event not found', async () => {
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.deleteEvent('user-1', 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete event successfully', async () => {
      const existingEvent = makeEvent();
      let selectCallCount = 0;

      dbService.db.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue(
                selectCallCount++ === 0 ? [existingEvent] : [],
              ),
          }),
        }),
      }));

      dbService.db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([existingEvent]),
        }),
      });

      const result = await service.deleteEvent('user-1', 1);
      expect(result).toEqual({ success: true });
    });

    it('should throw InternalServerErrorException on failed delete', async () => {
      const existingEvent = makeEvent();
      let selectCallCount = 0;

      dbService.db.select.mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue(
                selectCallCount++ === 0 ? [existingEvent] : [],
              ),
          }),
        }),
      }));

      dbService.db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.deleteEvent('user-1', 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
