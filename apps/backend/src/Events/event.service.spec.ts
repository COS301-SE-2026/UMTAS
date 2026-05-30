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
  UpdateEventDto,
} from './dto/EventDto.dto';

const userId = '550e8400-e29b-41d4-a716-446655440000';

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
    userID: userId,
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
    it('should throw BadRequestException when LECTURE type lacks moduleCode', async () => {
      const dto: CreateEventDto = {
        eventCriteria: makeEventCriteria({ type: EventType.LECTURE }),
      };
      await expect(service.createEvent(userId, dto)).rejects.toThrow(
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
      const result = await service.createEvent(userId, dto);
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
      await expect(service.createEvent(userId, dto)).rejects.toThrow(
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
      const result = await service.createEvent(userId, dto);
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
      await expect(service.createEvent(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for missing eventCriteria', async () => {
      const dto: CreateEventDto = { eventCriteria: undefined as any };
      await expect(service.createEvent(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw for lecture insert failure', async () => {
      const newEvent = makeEvent({
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'code',
        }),
      });

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
                  returning: jest.fn().mockResolvedValue([]),
                }),
              }), //insert

            select: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([makeModule()]),
                }),
              }),
            }), //seect
          };
          return cb(mockTx);
        },
      );

      const dto: CreateEventDto = {
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'code',
        }),
      };

      await expect(service.createEvent(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  }); //createEvent - Done

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

      const result = await service.getAllEvents(userId);
      expect(result.events).toHaveLength(2);
    });
  }); //getAll - Done

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

      await expect(service.getById(userId, 999)).rejects.toThrow(
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

      const result = await service.getById(userId, 1);
      expect(result.lecture).toEqual(row.lecture);
    });

    it('should return event without lecture', async () => {
      const mEvent = makeEvent({ eventID: 1 });
      const mRow = { event: mEvent, lecture: null };

      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mRow]),
            }),
          }),
        }),
      });

      const result = await service.getById(userId, 1);
      expect(result.event).toBeDefined();
      expect(result.lecture).toBeUndefined();
    });
  }); //getByid - Done

  describe('updateEvent', () => {
    it('should throw BadRequestException for missing eventCriteria', async () => {
      await expect(service.updateEvent(userId, 1, {} as any)).rejects.toThrow(
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
        service.updateEvent(userId, 1, {
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

      const result = await service.updateEvent(userId, 1, {
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
        service.updateEvent(userId, 1, {
          eventCriteria: { venue: 'Somewhere' },
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should update name and code with non existing eventCriteria', async () => {
      const exEvent = makeEvent({ eventCriteria: undefined });
      const exLecture = null;
      const updatedEvent = {
        ...exEvent,
        eventName: 'NewEventName',
        eventCode: 'NewCode',
      };

      //Mock Transaction
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
                        { event: exEvent, lecture: exLecture },
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

            delete: jest.fn(),
          };
          return cb(mockTx);
        },
      );

      const dto: UpdateEventDto = {
        name: 'NewEventName',
        code: 'NewCode',
      };

      const result = await service.updateEvent(userId, 1, dto);

      expect(result.event.name).toBe('NewEventName');
      expect(result.event.code).toBe('NewCode');
    });

    it('should trim to null, delete type if null, update recurring', async () => {
      const exEvent = makeEvent({
        eventCriteria: undefined,
        isRecurring: false,
      });
      const exLecture = null;
      const updatedEvent = {
        ...exEvent,
        eventName: null,
        eventCode: null,
        isRecurring: true,
        eventCriteria: {},
      };

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
                        { event: exEvent, lecture: exLecture },
                      ]),
                  }),
                }),
              }),
            }), //select

            update: jest.fn().mockReturnValue({
              set: jest.fn().mockImplementation((updateObj) => {
                expect(updateObj).toEqual({
                  eventName: null,
                  eventCode: null,
                  isRecurring: true,
                  eventCriteria: {},
                });
                return {
                  where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([updatedEvent]),
                  }),
                };
              }),
            }), //update

            delete: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([updatedEvent]),
            }),
          };
          return cb(mockTx);
        },
      );

      const dto: UpdateEventDto = {
        name: '   ',
        code: '   ',
        isRecurring: true,
        eventCriteria: { type: null },
      };

      const result = await service.updateEvent(userId, 1, dto);

      expect(result.event.name).toBeUndefined();
      expect(result.event.code).toBeUndefined();
      expect(result.event.isRecurring).toBe(true);
    });

    it('should upsert lecture, no pre-existing lecture, insert fail', async () => {
      const exEvent = makeEvent();

      const runWith = (lectureInsertResult: any[]) => {
        dbService.db.transaction.mockImplementation(
          (cb: (tx: any) => Promise<any>) => {
            let selectCallCount = 0;

            const mockTx = {
              select: jest.fn().mockImplementation(() => {
                if (++selectCallCount === 1) {
                  return {
                    from: jest.fn().mockReturnValue({
                      leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                          limit: jest
                            .fn()
                            .mockResolvedValue([
                              { event: exEvent, lecture: null },
                            ]),
                        }),
                      }),
                    }),
                  };
                }
                return {
                  from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue([makeModule()]),
                    }),
                  }),
                };
              }), //select

              update: jest.fn().mockReturnValue({
                set: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([exEvent]),
                  }),
                }),
              }), //update

              insert: jest.fn().mockReturnValue({
                values: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue(lectureInsertResult),
                }),
              }),
            };
            return cb(mockTx);
          },
        );
      };

      const dto = {
        eventCriteria: { type: EventType.LECTURE, moduleCode: 'code' },
      };
      const newLecture = makeLecture();

      runWith([newLecture]);
      await expect(service.updateEvent(userId, 1, dto)).resolves.toMatchObject({
        lecture: newLecture,
      });

      runWith([]);
      await expect(service.updateEvent(userId, 1, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should upsert lecture, pre-existing lecture, update fail', async () => {
      const exLecture = makeLecture();
      const exEvent = makeEvent({
        eventCriteria: makeEventCriteria({
          type: EventType.LECTURE,
          moduleCode: 'code',
        }),
      });

      const runWith = (lectureUpdateResult: any[]) => {
        dbService.db.transaction.mockImplementation(
          (cb: (tx: any) => Promise<any>) => {
            let selectCallCount = 0;

            const mockTx = {
              select: jest.fn().mockImplementation(() => {
                if (++selectCallCount === 1) {
                  return {
                    from: jest.fn().mockReturnValue({
                      leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                          limit: jest
                            .fn()
                            .mockResolvedValue([
                              { event: exEvent, lecture: exLecture },
                            ]),
                        }),
                      }),
                    }),
                  };
                }
                return {
                  from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue([makeModule()]),
                    }),
                  }),
                };
              }), //select

              update: jest
                .fn()
                .mockReturnValueOnce({
                  set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                      returning: jest.fn().mockResolvedValue([exEvent]),
                    }),
                  }),
                })
                .mockReturnValueOnce({
                  set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                      returning: jest
                        .fn()
                        .mockResolvedValue(lectureUpdateResult),
                    }),
                  }),
                }), //update
            };

            return cb(mockTx);
          },
        );
      };

      const dto = {
        eventCriteria: {
          type: EventType.LECTURE,
          moduleCode: 'code',
          venue: 'Lab 3',
        },
      };
      const updatedLecture = { ...exLecture, venue: 'Lab 3' };

      runWith([updatedLecture]);
      await expect(service.updateEvent(userId, 1, dto)).resolves.toMatchObject({
        lecture: updatedLecture,
      });

      runWith([]);
      await expect(service.updateEvent(userId, 1, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw NotFoundException if module not found for lecture in upsert', async () => {
      const exEvent = makeEvent();
      let selectCallCount = 0;

      dbService.db.transaction.mockImplementation(
        (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            select: jest.fn().mockImplementation(() => {
              if (++selectCallCount === 1) {
                return {
                  from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                      where: jest.fn().mockReturnValue({
                        limit: jest
                          .fn()
                          .mockResolvedValue([
                            { event: exEvent, lecture: null },
                          ]),
                      }),
                    }),
                  }),
                };
              }
              return {
                from: jest.fn().mockReturnValue({
                  where: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([]),
                  }),
                }),
              };
            }), //select

            update: jest.fn().mockReturnValue({
              set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  returning: jest.fn().mockResolvedValue([exEvent]),
                }),
              }),
            }),
          };

          return cb(mockTx);
        },
      );

      await expect(
        service.updateEvent(userId, 1, {
          eventCriteria: { type: EventType.LECTURE, moduleCode: 'UNKNOWN' },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  }); //update

  describe('deleteEvnt', () => {
    it('should throw NotFoundException when event not found', async () => {
      dbService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.deleteEvent(userId, 999)).rejects.toThrow(
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

      const result = await service.deleteEvent(userId, 1);
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

      await expect(service.deleteEvent(userId, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
