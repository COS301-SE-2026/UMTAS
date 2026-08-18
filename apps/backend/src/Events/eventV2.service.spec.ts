import { Test } from '@nestjs/testing';

//Constants
import { userId, moduleId, uniId } from '../Testing/constants';

//Actual Service imports
import { DatabaseService } from '../db/database.service';
import { EventServiceV2 } from './eventV2.service';
import { ModuleService } from '../Module/module.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { UniversityService } from '../University/university.service';

//Mocks
import { createMockDatabase, mockTransaction } from '../Testing/Mocks/';
import {
  createMockModuleService,
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
} from '../Testing/Factories/';

import { EventSource } from './dto/event.types';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('EventService', () => {
  let service: EventServiceV2;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockModuleService, reset: resetModule } = createMockModuleService();
  const { mockEventFingerprintService, reset: resetEventFingerprint } =
    createMockEventImportFingerprintService();
  const { mockUniversityService, reset: resetUniversity } =
    createMockUniversityService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventServiceV2,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: ModuleService, useValue: mockModuleService },
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

    //UnHapp - Recurring event - day of week required
    it('should throw if dayOfWeek is undefined for recurring event', async () => {
      //Arrange
      const event = createEvent(
        EventSource.UNIVERSITY,
        { isRecurring: true },
        { dayOfWeek: undefined },
      );
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      mockUniversityService.getById?.mockResolvedValue(uni);

      const module = createModule();

      mockModuleService.getById?.mockResolvedValue(module);

      mockTransaction(mockDb, {});

      //Act + Assert
      await expect(service.createV2(dto, userId, uniId)).rejects.toThrow(
        new BadRequestException(
          `day_Of_Week[${undefined}] required for recurring event.`,
        ),
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

      mockModuleService.getById?.mockResolvedValue(module);

      mockTransaction(mockDb, {
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

      mockModuleService.getById?.mockResolvedValue(module);

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

    //Happy - return newly created event
    it('should create a new event', async () => {
      //Arrange
      const event = createEvent(EventSource.UNIVERSITY, {}, { moduleId });
      const dto = createCreateEventDtoV2(event);

      const uni = createUniversity();

      mockUniversityService.getById?.mockResolvedValue(uni);

      const module = createModule();

      mockModuleService.getById?.mockResolvedValue(module);

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
});
