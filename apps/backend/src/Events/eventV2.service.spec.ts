import { Test } from '@nestjs/testing';

//Constants
import { userId, moduleId, uniId } from '../Testing/constants';

//Actual Service imports
import { DatabaseService } from '../db/database.service';
import { EventServiceV2 } from './eventV2.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { UniversityService } from '../University/university.service';

//Mocks
import {
  createDbChain,
  createMockDatabase,
  mockTransaction,
} from '../Testing/Mocks/';
import {
  createMockEventImportFingerprintService,
  createMockUniversityService,
} from '../Testing/Mocks/services/';

//Factories
import {
  createEvent,
  createUniversityEvent,
  createUniversity,
  createEventDto,
  createModule,
  createCreateEventDtoV2,
  createEventCriteriaV2,
} from '../Testing/Factories/';

import { EventSource } from './dto/event.types';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createMockModuleServiceV2 } from 'src/Testing/Mocks/services/module.mock';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';

describe('EventServiceV2', () => {
  let service: EventServiceV2;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockModuleServiceV2, reset: resetModule } =
    createMockModuleServiceV2();
  const { mockEventFingerprintService, reset: resetEventFingerprint } =
    createMockEventImportFingerprintService();
  const { mockUniversityService, reset: resetUniversity } =
    createMockUniversityService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventServiceV2,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: ModuleServiceV2, useValue: mockModuleServiceV2 },
        {
          provide: EventImportFingerprintService,
          useValue: mockEventFingerprintService,
        },
        { provide: UniversityService, useValue: mockUniversityService },
      ],
    }).compile();

    service = module.get(EventServiceV2);
  });

  afterEach(() => {
    resetDb();
    resetModule();
    resetEventFingerprint();
    resetUniversity();
  });

  //TESTS
  //CreateV2
  describe('Test_createEventV2', () => {
    //UnHappy - University not provided
    it('should throw if university is undefined', async () => {
      //Arrange
      const event = createEvent();
      const dto = createCreateEventDtoV2(event);

      mockTransaction(mockDb, {});

      //Act + Assert
      await expect(service.createV2(dto, userId, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    //UnHappy - moduleId is invalid
    it('should throw if module is not defined', async () => {
      //Arrange
      const event = createEvent(
        EventSource.UNIVERSITY,
        {},
        { moduleId: undefined },
      );
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      mockUniversityService.getById?.mockResolvedValue(uni);

      mockTransaction(mockDb, {});

      //Act + Assert
      await expect(service.createV2(dto, userId, uniId)).rejects.toThrow(
        new BadRequestException(`moduleId[${undefined}] is invalid`),
      );
    });

    //UnHapp - failed to insert event
    it('should throw if failed to insert new Event', async () => {
      //Arrange
      const event = createEvent();
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      mockUniversityService.getById?.mockResolvedValue(uni);

      const module = createModule();

      mockModuleServiceV2.getByIdV2?.mockResolvedValue(module);

      mockEventFingerprintService.buildForEvent?.mockReturnValue('something');

      mockTransaction(mockDb, {
        select: [[]],
        insert: [[]],
      });

      //Act + Assert
      await expect(service.createV2(dto, userId, uniId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    //UnHappy - UniversityEvent insert failed
    it('should throw if failed to insert new UniversityEvent', async () => {
      //Arrange
      const event = createEvent();
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      mockUniversityService.getById?.mockResolvedValue(uni);

      const module = createModule();

      mockModuleServiceV2.getById?.mockResolvedValue(module);

      mockTransaction(mockDb, {
        select: [
          [], //mapEventToDto
        ],
        insert: [
          [event], //getEventVenues
          [], //createV2
        ],
      });

      //Act + Assert
      await expect(service.createV2(dto, userId, uniId)).rejects.toThrow(
        new InternalServerErrorException(
          `Failed to create UniversityEvent entry`,
        ),
      );
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });

    //UnHapp - Test defaults on createEventDtoV2
    it('should default if createEventDtoV2 only contains: eventCriteria, ', async () => {
      //Arrange
      const event = createEvent(EventSource.UNIVERSITY, {
        eventName: undefined,
        activityCode: undefined,
        activityType: undefined,
        isRecurring: undefined,
        validated: undefined,
      });
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      // Validate University
      mockUniversityService.getById?.mockResolvedValue(uni);

      const module = createModule();

      mockModuleServiceV2.getById?.mockResolvedValue(module);

      const uniEvent = createUniversityEvent({
        eventID: event.eventID,
        moduleID: moduleId,
      });

      const eventCreated = createEvent(
        EventSource.UNIVERSITY,
        {
          eventName: 'Event_lec',
          activityCode: 'lec',
          activityType: 'lecture',
          isRecurring: false,
          validated: false,
        },
        {
          moduleId: module.moduleID,
        },
      );

      mockTransaction(mockDb, {
        select: [
          [], //mapEventToDto
        ],
        insert: [
          [eventCreated], //getEventVenues
          [uniEvent], //createV2
        ],
      });

      const expected = {
        event: createEventDto(
          {
            eventId: eventCreated.eventID,
            activityCode: 'lec',
            activityType: 'lecture',
            eventName: 'Event_lec',
            isRecurring: false,
            validated: false,
          },
          createEventCriteriaV2({
            moduleId: module.moduleID,
          }),
        ),
      };

      //Act + Assert
      const result = await service.createV2(dto, userId, uniId);

      //ACt + Assert

      expect(result).toMatchObject(expected);
    });

    //Happy - return newly created event
    it('should create a new event', async () => {
      //Arrange
      const event = createEvent(EventSource.UNIVERSITY, {}, { moduleId });
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      mockUniversityService.getById?.mockResolvedValue(uni);

      const module = createModule();

      mockModuleServiceV2.getById?.mockResolvedValue(module);

      const uniEvent = createUniversityEvent({
        eventID: event.eventID,
        moduleID: moduleId,
      });

      mockTransaction(mockDb, {
        select: [
          [], //mapEventToDto
        ],
        insert: [
          [event], //getEventVenues
          [uniEvent], //createV2
        ],
      });

      const expected = {
        event: createEventDto(
          {
            eventId: event.eventID,
            activityCode: event.activityCode,
            activityType: 'lecture',
            eventName: 'Lecture 1',
          },
          event.eventCriteria,
        ),
      };

      //Act
      const result = await service.createV2(dto, userId, uniId);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('event validation and statistics', () => {
    it('toggles validation and maps the updated event', async () => {
      const current = createEvent(
        EventSource.UNIVERSITY,
        { validated: false },
        { moduleId },
      );
      const updated = { ...current, validated: true };
      const mapped = createEventDto(
        { eventId: current.eventID, validated: true },
        current.eventCriteria,
      );
      jest.spyOn(service, 'getById').mockResolvedValue({ event: mapped });
      (mockDb.update as unknown as jest.Mock).mockReturnValue(
        createDbChain([updated]),
      );
      jest
        .spyOn(service as never, 'mapEventToDto' as never)
        .mockResolvedValue(mapped as never);

      await expect(service.validateEvent(current.eventID)).resolves.toEqual({
        event: mapped,
        message: `Event[${updated.eventName}] validated=true`,
      });
      expect(mockDb.update).toHaveBeenCalledTimes(1);
    });

    it('honors an explicit validation value', async () => {
      const current = createEvent(
        EventSource.UNIVERSITY,
        { validated: true },
        { moduleId },
      );
      const updated = { ...current, validated: false };
      const mapped = createEventDto(
        { eventId: current.eventID, validated: false },
        current.eventCriteria,
      );
      jest.spyOn(service, 'getById').mockResolvedValue({ event: mapped });
      (mockDb.update as unknown as jest.Mock).mockReturnValue(
        createDbChain([updated]),
      );
      jest
        .spyOn(service as never, 'mapEventToDto' as never)
        .mockResolvedValue(mapped as never);

      await expect(
        service.validateEvent(current.eventID, false),
      ).resolves.toMatchObject({ event: { validated: false } });
    });

    it('returns weekly event statistics after validating the university', async () => {
      const rows = [
        { dayOfWeek: 'monday', EventCount: 4 },
        { dayOfWeek: 'wednesday', EventCount: 2 },
      ];
      mockUniversityService.getById?.mockResolvedValue(createUniversity());
      (mockDb.select as unknown as jest.Mock).mockReturnValue(
        createDbChain(rows),
      );

      await expect(service.getStatisticsWeekly(uniId)).resolves.toEqual({
        data: rows,
      });
      expect(mockUniversityService.getById).toHaveBeenCalledWith(uniId, mockDb);
    });

    it('normalizes nullable venue names in event statistics', async () => {
      const rows = [
        {
          VenueID: 'venue-1',
          VenueName: null,
          EventCount: 3,
          ProjectedAttendance: 20,
        },
      ];
      mockUniversityService.getById?.mockResolvedValue(createUniversity());
      (mockDb.select as unknown as jest.Mock).mockReturnValue(
        createDbChain(rows),
      );

      await expect(service.getStatisticsVenues(uniId)).resolves.toEqual({
        data: [
          {
            VenueID: 'venue-1',
            VenueName: 'NoName',
            EventCount: 3,
            ProjectedAttendance: 20,
          },
        ],
      });
    });
  });

  describe('event criteria validation', () => {
    it.each(['9am', '24:00', '08:60'])(
      'rejects invalid start time %s',
      async (startTime) => {
        await expect(
          (service as any).validateEventCriteria(
            { moduleId, startTime, endTime: '10:00' },
            false,
            mockDb,
          ),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('moves an end time before the start one hour forward', async () => {
      mockModuleServiceV2.getByIdV2?.mockResolvedValue(createModule());

      await expect(
        (service as any).validateEventCriteria(
          { moduleId, startTime: '10:30', endTime: '09:00' },
          false,
          mockDb,
        ),
      ).resolves.toMatchObject({
        startTime: '10:30',
        endTime: '11:30',
      });
    });

    it('defaults recurring criteria to a day and non-recurring criteria to a date', async () => {
      mockModuleServiceV2.getByIdV2?.mockResolvedValue(createModule());
      const recurring = await (service as any).validateEventCriteria(
        { moduleId },
        true,
        mockDb,
      );
      const single = await (service as any).validateEventCriteria(
        { moduleId },
        false,
        mockDb,
      );

      expect(recurring.dayOfWeek).toBeDefined();
      expect(single.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
