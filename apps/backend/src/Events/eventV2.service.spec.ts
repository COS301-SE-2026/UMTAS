import { Test } from '@nestjs/testing';

//Constants
import { userId, moduleId, uniId } from '../Testing/constants';

//Actual Service imports
import { DatabaseService } from '../db/database.service';
import { EventServiceV2 } from './eventV2.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { UniversityService } from '../University/university.service';

//Mocks
import { createMockDatabase, mockTransaction } from '../Testing/Mocks/';
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
import { createMockModuleServiceV2 } from 'src/Testing/Mocks/services/moduleV2.mock';
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
});
