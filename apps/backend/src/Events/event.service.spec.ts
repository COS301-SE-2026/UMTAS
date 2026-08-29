import { Test } from '@nestjs/testing';

//Constants
import {
  userId,
  moduleId,
  uniId,
  venueId,
  eventId,
} from '../Testing/constants';

//Actual Service imports
import { DatabaseService } from '../db/database.service';
import { EventService } from './event.service';
import { ModuleService } from '../Module/module.service';
import { EventImportFingerprintService } from './event-import-fingerprint.service';
import { UniversityService } from '../University/university.service';

//Mocks
import {
  createMockDatabase,
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/';
import {
  createMockModuleService,
  createMockEventImportFingerprintService,
  createMockUniversityService,
} from '../Testing/Mocks/services/';

//Factories
import {
  createEvent,
  createUniversityEvent,
  createCreateEventDto,
  createEventCriteria,
  createUniversity,
  createEventDto,
  createPersonalEvent,
} from '../Testing/Factories/';

import { EventSource } from './dto/event.types';
import { CreateEventDto, UpdateEventDto } from './dto/EventDto.dto';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('EventService', () => {
  let service: EventService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockModuleService, reset: resetModule } = createMockModuleService();
  const { mockEventFingerprintService, reset: resetEventFingerprint } =
    createMockEventImportFingerprintService();
  const { mockUniversityService, reset: resetUniversity } =
    createMockUniversityService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: ModuleService, useValue: mockModuleService },
        {
          provide: EventImportFingerprintService,
          useValue: mockEventFingerprintService,
        },
        { provide: UniversityService, useValue: mockUniversityService },
      ],
    }).compile();

    service = module.get(EventService);
  });

  afterEach(() => {
    resetDb();
    resetModule();
    resetEventFingerprint();
    resetUniversity();
  });

  //TESTS
  //Create
  describe('Test_Create_Events', () => {
    //University
    describe('Test_createUniversityEvent', () => {
      //UnHappy - activityType is required
      it('should throw if activityType not provided', async () => {
        //Arrange
        const eventCriteria = createEventCriteria();
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
        };

        mockTransaction(mockDb, {});

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(BadRequestException);
      });

      //UnHappy - module doesn't belong to a university
      it('should throw if module is not owned by university', async () => {
        //Arrange
        const eventCriteria = createEventCriteria();
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
        };

        mockTransaction(mockDb, {
          select: [
            [],
            [], //getMOduleUniversityIds
          ],
        });

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(BadRequestException);
        expect(mockDb.select).toHaveBeenCalledTimes(2); //getModuleUniversityIds
      });

      //UnHappy - user doesn't have access to university
      it('should throw if user cannot create events for university', async () => {
        //Arrange
        const eventCriteria = createEventCriteria();
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
        };

        const uni = createUniversity();

        mockTransaction(mockDb, {
          select: [
            [uni.UniversityID],
            [], //getMOduleUniversityIds
            [{ role: 'user' }],
            [{ moduleId }],
            [{ universityId: uniId }],
            [{ universityId: uniId, role: 'student' }],
            [], //resolveAuthorizedModuleUniversity
          ],
        });

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(ForbiddenException);
        expect(mockDb.select).toHaveBeenCalledTimes(7);
      });

      //UnHappy - venues don't exist
      it('should throw if venues do not exist', async () => {
        //Arrange
        const eventCriteria = createEventCriteria();
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
          venues: [{ venueName: 'testVenue', venueId }],
        };

        const uni = createUniversity();

        mockTransaction(mockDb, {
          select: [
            [uni.UniversityID],
            [], //getMOduleUniversityIds
            [{ role: 'uni_admin' }],
            [{ moduleId }],
            [{ universityId: uniId }],
            [{ universityId: uniId, role: 'UNIVERSITY_ADMIN' }],
            [{ universityId: uniId }], //resolveAuthorizedModuleUniversity
            [], //validateVenueIds
          ],
        });

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(BadRequestException);
        expect(mockDb.select).toHaveBeenCalledTimes(9);
      });

      //UnHappy - assertTiminMatchesRecurrence
      it('should throw if recurring event but no date', async () => {
        //Arrange
        const eventCriteria = createEventCriteria(EventSource.UNIVERSITY, {
          date: undefined,
        });
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
          venues: [{ venueName: 'testVenue', venueId }],
        };

        const uni = createUniversity();

        mockTransaction(mockDb, {
          select: [
            [uni.UniversityID],
            [], //getMOduleUniversityIds
            [{ role: 'uni_admin' }],
            [{ moduleId }],
            [{ universityId: uniId }],
            [{ universityId: uniId, role: 'UNIVERSITY_ADMIN' }],
            [{ universityId: uniId }], //resolveAuthorizedModuleUniversity
            [{ venueId }], //validateVenueIds
          ],
        });

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(
          new BadRequestException(
            'Recurring events require dayOfWeek and must not include date',
          ),
        );
        expect(mockDb.select).toHaveBeenCalledTimes(9);
      });

      //UnHappy - insert failed
      it('should create a university event', async () => {
        //Arrange
        const eventCriteria = createEventCriteria(EventSource.UNIVERSITY, {
          date: undefined,
          dayOfWeek: 'monday',
        });
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
          venues: [{ venueName: 'testVenue', venueId }],
        };

        const uni = createUniversity();

        // const event = createEvent();

        mockTransaction(mockDb, {
          select: [
            [uni.UniversityID],
            [], //getMOduleUniversityIds
            [{ role: 'uni_admin' }],
            [{ moduleId }],
            [{ universityId: uniId }],
            [{ universityId: uniId, role: 'UNIVERSITY_ADMIN' }],
            [{ universityId: uniId }], //resolveAuthorizedModuleUniversity
            [{ venueId }], //validateVenueIds
          ],
          insert: [
            [], //createEvent - insert failed
          ],
        });

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(InternalServerErrorException);
        expect(mockDb.select).toHaveBeenCalledTimes(9);
        expect(mockDb.insert).toHaveBeenCalledTimes(1);
      });

      //UnHappy - insert failed
      it('should throw if uniEvent insert failed', async () => {
        //Arrange
        const eventCriteria = createEventCriteria(EventSource.UNIVERSITY, {
          date: undefined,
          dayOfWeek: 'monday',
        });
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
          venues: [{ venueName: 'testVenue', venueId }],
        };

        const uni = createUniversity();

        // const event = createEvent();

        mockTransaction(mockDb, {
          select: [
            [uni.UniversityID],
            [], //getMOduleUniversityIds
            [{ role: 'uni_admin' }],
            [{ moduleId }],
            [{ universityId: uniId }],
            [{ universityId: uniId, role: 'UNIVERSITY_ADMIN' }],
            [{ universityId: uniId }], //resolveAuthorizedModuleUniversity
            [{ venueId }], //validateVenueIds
          ],
          insert: [
            [createEvent()], //createEvent
            [], //createUniversityEvent - failed insert
          ],
        });

        //Act + Assert
        await expect(
          service.createUniversityEvent(userId, moduleId, dto),
        ).rejects.toThrow(InternalServerErrorException);
        expect(mockDb.select).toHaveBeenCalledTimes(9);
        expect(mockDb.insert).toHaveBeenCalledTimes(2);
      });

      //Happy - university event created
      it('should throw if uniEvent insert failed', async () => {
        //Arrange
        const eventCriteria = createEventCriteria(EventSource.UNIVERSITY, {
          date: undefined,
          dayOfWeek: 'monday',
          moduleId,
        });
        const dto: CreateEventDto = {
          eventCriteria: eventCriteria,
          activityType: 'lecture',
          venues: [],
        };

        const uni = createUniversity();

        const event = createEvent(
          EventSource.UNIVERSITY,
          { eventID: eventId },
          eventCriteria,
        );
        const uniEvent = createUniversityEvent();

        mockTransaction(mockDb, {
          select: [
            [uni.UniversityID],
            [], //getMOduleUniversityIds
            [{ role: 'uni_admin' }],
            [{ moduleId }],
            [{ universityId: uniId }],
            [{ universityId: uniId, role: 'UNIVERSITY_ADMIN' }], //resolveAuthorizedModuleUniversity
            [],
          ],
          insert: [
            [event], //createEvent
            [uniEvent], //createUniversityEvent
          ],
        });

        const expected = createEventDto(
          {
            eventId,
            eventName: event.eventName,
            activityCode: event.activityCode,
            activityType: 'lecture',
            venues: [],
          },
          eventCriteria,
        );

        //Act
        const result = await service.createUniversityEvent(
          userId,
          moduleId,
          dto,
        );

        // console.log(`Here: \n expected[${JSON.stringify(expected)}] \n result[${JSON.stringify(result)}]`);

        //Act + Assert
        expect(result).toMatchObject(expected);
        expect(mockDb.select).toHaveBeenCalledTimes(8);
        expect(mockDb.insert).toHaveBeenCalledTimes(2);
      });
    });

    //Personal
    describe('Test_createPersonalEvent', () => {
      it('should create a personal event', async () => {
        const newEvent = createEvent(EventSource.PERSONAL);
        const personalEvent = createPersonalEvent({
          eventID: newEvent.eventID,
        });

        mockTransaction(mockDb, {
          insert: [[newEvent], [personalEvent]],
          select: [[]],
        });

        const result = await service.createPersonalEvent(
          userId,
          createCreateEventDto(newEvent),
        );

        expect(result).toMatchObject({
          eventCriteria: expect.objectContaining({
            eventSource: 'personal',
            date: expect.any(String),
            startTime: expect.any(String),
            endTime: expect.any(String),
          }),
        });
      });
    });
  }); //END_Test_Creates

  //CREATE
  describe('Test_CreateEvent', () => {
    it('should create a simple university event', async () => {
      //Arrange
      const newEvent = createEvent(EventSource.UNIVERSITY, {}, { moduleId });
      const createEventDto = createCreateEventDto(newEvent);

      // console.log(`Here: \n Event[${JSON.stringify(newEvent)}] \n createEventDto[${JSON.stringify(createEventDto)}]`);

      const uniEvent = createUniversityEvent({
        moduleID: moduleId,
        eventID: newEvent.eventID,
      });

      mockTransaction(mockDb, {
        select: [
          [{ universityId: uniId }],
          [],
          [{ role: 'sys_admin' }],
          [],
          [],
          [],
          [],
        ],
        insert: [[newEvent], [uniEvent]],
      });

      //Act
      const result = await service.create(userId, createEventDto);

      //Assert
      expect(result.event).toMatchObject({
        eventId: newEvent.eventID,
        eventName: newEvent.eventName,
        activityCode: newEvent.activityCode,
        activityType: newEvent.activityType,
        eventCriteria: newEvent.eventCriteria,
        isRecurring: newEvent.isRecurring,
        validated: newEvent.validated,
      });
    });
  }); //END_Test_CreateEvent

  //GetAll
  describe('Test_GetAllEvents', () => {
    it('should return all events for module', async () => {
      const type = EventSource.UNIVERSITY;
      const events = [
        createEvent(type, {}, { moduleId }),
        createEvent(type, {}, { moduleId }),
      ];

      mockTransaction(mockDb, {
        select: [events, [], []],
      });

      const result = await service.getAllEvents(userId, { moduleId });

      expect(result.events).toMatchObject([
        { eventId: events[0].eventID, eventName: events[0].eventName },
        { eventId: events[1].eventID, eventName: events[1].eventName },
      ]);
    });
  });

  //GetById
  describe('Test_GetEventById', () => {
    it('should return event by eventId', async () => {
      const event = createEvent();

      mockSequentialResults(mockDb.select, [[event], []]);

      const result = await service.getById(event.eventID);

      expect(result.event).toMatchObject({
        eventId: event.eventID,
        eventName: event.eventName,
        activityCode: event.activityCode,
        activityType: event.activityType,
        eventCriteria: event.eventCriteria,
        isRecurring: event.isRecurring,
        validated: event.validated,
      });
    });
  });

  //Update
  describe('Test_UpdateEvent', () => {
    it('should update all event fields', async () => {
      //Arrange
      const oldEvent = createEvent();
      const updateDto: UpdateEventDto = {
        eventName: 'NewName',
        activityCode: 'newCode',
        isRecurring: false,
        eventCriteria: {
          date: 'dd-mm-yyyy',
          startTime: '20:00',
          endTime: '21:00',
        },
      };
      const updatedEvent = createEvent(
        EventSource.UNIVERSITY,
        {
          eventName: updateDto.eventName,
          activityCode: updateDto.activityCode,
          isRecurring: updateDto.isRecurring,
        },
        {
          date: updateDto.eventCriteria?.date,
          startTime: updateDto.eventCriteria?.startTime,
          endTime: updateDto.eventCriteria?.endTime,
        },
      );

      mockSequentialResults(mockDb.select, [[oldEvent], [], []]);

      mockTransaction(mockDb, {
        update: [[updatedEvent]],
      });

      //Act
      const result = await service.updateEvent(
        userId,
        'uni_admin',
        oldEvent.eventID,
        updateDto,
      );

      //Assert
      expect(result.event).toMatchObject({
        eventId: updatedEvent.eventID,
        eventName: updatedEvent.eventName,
        activityCode: updatedEvent.activityCode,
        isRecurring: updatedEvent.isRecurring,
      });
    });
  });

  //Delete
  describe('Test_DeleteEvent', () => {
    it('should delete event - admin', async () => {
      const event = createEvent();

      mockTransaction(mockDb, {
        select: [[event], []],
        delete: [[]],
      });

      const result = await service.deleteEvent(
        userId,
        'uni_admin',
        event.eventID,
      );

      //Assert
      expect(result).toMatchObject({
        eventName: event.eventName,
        activityCode: event.activityCode,
        success: true,
      });
    });
  }); //END_Test_DeleteEvent
});
