import { Test } from '@nestjs/testing';

//Constants
import { timetableId, userId } from '../Testing/constants';

//Actual Services
import { TimetableService } from './timetable.service';
import { DatabaseService } from '../db/database.service';
import { EventService } from '../Events/event.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockSequentialResults,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  createCreateTimetableDto,
  createEvent,
  createEventDto,
  createTimetable,
  createUpdateTimetableDto,
  createUserTimetable,
} from '../Testing/Factories/';

//Mock Services
import { createMockEventService } from '../Testing/Mocks/services';

//Exceptions
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

//DTO's
import {
  TimetableListResponseDto,
  TimetableResponseDto,
} from './dto/timetable.dto';

describe('Timetable Service', () => {
  let service: TimetableService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockEventService, reset: resetEvents } = createMockEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TimetableService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get(TimetableService);
  });

  afterEach(() => {
    resetDb();
    resetEvents();
  });

  //TESTS
  //CREATE
  describe('Test_createTimetable', () => {
    //UnHappy - throw if insert failed
    it('should throw if Timetable insert failed', async () => {
      //Arrange
      const dto = createCreateTimetableDto({ timetableName: undefined });

      mockTransaction(mockDb, {
        insert: [
          [], //Insert Failed
        ],
      });

      //Act + Assert
      await expect(service.createTimetable(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    //UnHappy - throw if UserTimetable insert failed
    it('should throw if UserTimetable insert failed', async () => {
      //Arrange
      const dto = createCreateTimetableDto();
      const timetable = createTimetable();
      mockTransaction(mockDb, {
        insert: [
          [timetable], //Timetable
          [], //UserTimetable insert failed
        ],
      });

      //Act + Assert
      await expect(service.createTimetable(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });

    //Happy - create empty timetable
    it('should create an empty timetable', async () => {
      //Arrange
      const dto = createCreateTimetableDto({ eventIds: [] });
      const timetable = createTimetable({ timetableName: dto.timetableName });
      const userTimetable = createUserTimetable({
        UserID: userId,
        TimetableID: timetable.timetableID,
      });

      mockTransaction(mockDb, {
        insert: [
          [timetable], //Timetable
          [userTimetable], //UserTimetable insert failed
        ],
      });

      const expected: TimetableResponseDto = {
        UserTimetableID: userTimetable.UserTimetableID,
        timetable: timetable,
      };

      //Act
      const result = await service.createTimetable(userId, dto);

      //Act + Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });

    //Happy - create timetable with events
    it('should create a timetable with an event', async () => {
      //Arrange
      const event = createEvent();
      const dto = createCreateTimetableDto({ eventIds: [event.eventID] });
      const timetable = createTimetable({ timetableName: dto.timetableName });
      const userTimetable = createUserTimetable({
        UserID: userId,
        TimetableID: timetable.timetableID,
      });

      mockTransaction(mockDb, {
        select: [[event]],
        insert: [
          [timetable], //Timetable
          [userTimetable], //UserTimetable insert failed
          [{ eventID: event.eventID, timetableID: timetable.timetableID }],
        ],
      });

      const expected: TimetableResponseDto = {
        UserTimetableID: userTimetable.UserTimetableID,
        timetable: timetable,
        eventIds: [event.eventID],
      };

      //Act
      const result = await service.createTimetable(userId, dto);

      //Act + Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.insert).toHaveBeenCalledTimes(3);
      expect(mockDb.select).toHaveBeenCalled();
    });
  }); //END_Test_createTimetable

  //GetAll
  describe('Test_getAllTimetables', () => {
    //UnHappy - return empty timetables
    it('should return empty timetables if none found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      const expected: TimetableListResponseDto = {
        timetables: [],
      };

      //Act
      const result = await service.getAllTimetables(userId);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalled();
    });

    //Happy - return timetables
    it('should return timetables found for user', async () => {
      //Arrange
      const timetable1 = createTimetable();
      const timetable2 = createTimetable();

      const userTimetable1 = createUserTimetable();
      const userTimetable2 = createUserTimetable();

      const event = createEvent();

      const dbResponse = [
        {
          UserTimetable: userTimetable1,
          timetable: timetable1,
          eventID: event.eventID,
        },
        {
          UserTimetable: userTimetable2,
          timetable: timetable2,
          eventID: event.eventID,
        },
      ];
      mockDbResult(mockDb.select, dbResponse);

      const expected: TimetableListResponseDto = {
        timetables: [
          {
            timetable: timetable1,
            UserTimetableID: userTimetable1.UserTimetableID,
            eventIds: [event.eventID],
          },
          {
            timetable: timetable2,
            UserTimetableID: userTimetable2.UserTimetableID,
            eventIds: [event.eventID],
          },
        ],
      };

      //Act
      const result = await service.getAllTimetables(userId);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalled();
    });
  }); //END_Test_getAllTimetables

  //GetById
  describe('Test_getTimetableById', () => {
    //UnHappy - no timetable found
    it('should throw if no timetable found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(
        service.getTimetableById(userId, timetableId),
      ).rejects.toThrow(NotFoundException);
      expect(mockDb.select).toHaveBeenCalled();
    });

    //Happy - return timetable with event ids
    it('should return timetable with eventIds', async () => {
      //Arrange
      const timetable = createTimetable();
      const userTimetable = createUserTimetable();
      const event = createEvent();

      const dbResult = {
        UserTimetable: userTimetable,
        timetable,
        eventID: event.eventID,
      };

      mockDbResult(mockDb.select, [dbResult]);

      const expected: TimetableResponseDto = {
        UserTimetableID: userTimetable.UserTimetableID,
        timetable,
        eventIds: [event.eventID],
      };

      //Act
      const result = await service.getTimetableById(
        userId,
        timetable.timetableID,
      );

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalled();
    });
  }); //END_Test_getTimetableById

  describe('V2 timetable reads', () => {
    it('returns populated timetables for the user', async () => {
      const timetable = createTimetable();
      const userTimetable = createUserTimetable({
        UserID: userId,
        TimetableID: timetable.timetableID,
      });
      const eventEntity = createEvent();
      const event = createEventDto(
        { eventId: eventEntity.eventID },
        eventEntity.eventCriteria,
      );
      mockDbResult(mockDb.select, [
        {
          UserTimetableID: userTimetable.UserTimetableID,
          timetable,
        },
      ]);
      mockEventService.getAllEvents?.mockResolvedValue({ events: [event] });

      await expect(service.getAllV2(userId)).resolves.toEqual({
        timetables: [
          {
            UserTimetableID: userTimetable.UserTimetableID,
            timetable,
            events: [event],
          },
        ],
      });
      expect(mockEventService.getAllEvents).toHaveBeenCalledWith(userId, {
        timetableId: timetable.timetableID,
      });
    });

    it('propagates relationship-query failures from event loading', async () => {
      const timetable = createTimetable();
      mockDbResult(mockDb.select, [
        { UserTimetableID: 'user-timetable-1', timetable },
      ]);
      mockEventService.getAllEvents?.mockRejectedValue(
        new Error('event relationship query failed'),
      );

      await expect(service.getAllV2(userId)).rejects.toThrow(
        'event relationship query failed',
      );
    });

    it('rejects a missing timetable', async () => {
      mockSequentialResults(mockDb.select, [[]]);

      await expect(service.getByIdV2(userId, timetableId)).rejects.toThrow(
        `Timetable[${timetableId}] not found`,
      );
    });

    it('rejects a timetable the user does not own', async () => {
      const timetable = createTimetable({ timetableID: timetableId });
      mockSequentialResults(mockDb.select, [[timetable], []]);

      await expect(service.getByIdV2(userId, timetableId)).rejects.toThrow(
        `User[${userId}] doesn't seem to own timetable[${timetableId}]`,
      );
    });

    it('returns an owned timetable with events using an explicit transaction', async () => {
      const timetable = createTimetable({ timetableID: timetableId });
      const userTimetable = createUserTimetable({
        UserID: userId,
        TimetableID: timetableId,
      });
      const eventEntity = createEvent();
      const event = createEventDto(
        { eventId: eventEntity.eventID },
        eventEntity.eventCriteria,
      );
      mockSequentialResults(mockDb.select, [[timetable], [userTimetable]]);
      mockEventService.getAllEvents?.mockResolvedValue({ events: [event] });

      await expect(
        service.getByIdV2(userId, timetableId, mockDb),
      ).resolves.toEqual({
        UserTimetableID: userTimetable.UserTimetableID,
        timetable,
        events: [event],
      });
      expect(mockEventService.getAllEvents).toHaveBeenCalledWith(
        userId,
        { timetableId },
        mockDb,
      );
    });
  });

  //Update
  describe('Test_updateTimetable', () => {
    //UnHappy - timetable doesn't exist
    it('should throw if timetable does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [
          [], //UserTimetable
        ],
      });

      const dto = createUpdateTimetableDto();

      //Act + Assert
      await expect(
        service.updateTimetable(userId, timetableId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    //UnHappy - Update failed
    it('should throw if update failed', async () => {
      //Arrange
      const timetable = createTimetable();
      const userTimetable = createUserTimetable();

      const dbResponse = {
        UserTimetable: userTimetable,
        Timetable: timetable,
      };

      mockTransaction(mockDb, {
        select: [
          [dbResponse], //UserTimetable
        ],
        update: [[]], //update failed
      });

      const dto = createUpdateTimetableDto();

      //Act + Assert
      await expect(
        service.updateTimetable(userId, timetableId, dto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    //UnHappy - no fields to update
    it('should throw if no fields to update', async () => {
      //Arrange
      const dto = {};

      //Act + Assert
      await expect(
        service.updateTimetable(userId, timetableId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    //Happy - update timetable name
    it('should update the timetables name', async () => {
      //Arrange
      const timetable = createTimetable();
      const userTimetable = createUserTimetable();
      const dto = createUpdateTimetableDto({
        timetableName: 'newName',
        addEventIds: [],
        removeEventIds: [],
      });
      const updatedTimetable = createTimetable(dto);
      const event = createEvent();

      const dbResponse = {
        UserTimetable: userTimetable,
        Timetable: timetable,
      };

      const fetchResult = {
        UserTimetable: userTimetable,
        timetable: updatedTimetable,
        eventID: event.eventID,
      };

      const expected: TimetableResponseDto = {
        UserTimetableID: userTimetable.UserTimetableID,
        timetable: updatedTimetable,
        eventIds: [event.eventID],
      };

      mockTransaction(mockDb, {
        select: [
          [dbResponse], //UserTimetable
          [fetchResult], //fetchTimetableWithEvents
        ],
        update: [[updatedTimetable]], //update failed
      });

      //Act
      const result = await service.updateTimetable(userId, timetableId, dto);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalledTimes(2);
      expect(mockDb.update).toHaveBeenCalled();
    });

    //Happy - add and remove events
    it('should insert and delete eventIds', async () => {
      //Arrange
      const timetable = createTimetable();
      const userTimetable = createUserTimetable();
      const eventToDelete = createEvent();
      const eventToAdd = createEvent();

      const dto = createUpdateTimetableDto({
        timetableName: undefined,
        addEventIds: [eventToAdd.eventID],
        removeEventIds: [eventToDelete.eventID],
      });

      const dbResponse = {
        UserTimetable: userTimetable,
        Timetable: timetable,
      };

      const fetchResult = {
        UserTimetable: userTimetable,
        timetable,
        eventID: eventToAdd.eventID,
      };

      const expected: TimetableResponseDto = {
        UserTimetableID: userTimetable.UserTimetableID,
        timetable,
        eventIds: [eventToAdd.eventID],
      };

      mockTransaction(mockDb, {
        select: [
          [dbResponse], //UserTimetable
          [{ eventID: eventToAdd.eventID }], //validateEventIds
          [fetchResult], //fetchTimetableWithEvents
        ],
        insert: [[]], //hasAdd
        delete: [[]], //hasRemove
      });

      //Act
      const result = await service.updateTimetable(userId, timetableId, dto);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalledTimes(3);
      expect(mockDb.update).not.toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  }); //END_Test_updateTimetable

  //Delete
  describe('Test_deleteTimetable', () => {
    //UnHappy - timetable doesn't exist
    it('should throw if timetable does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(
        service.deleteTimetable(userId, timetableId),
      ).rejects.toThrow(NotFoundException);
      expect(mockDb.select).toHaveBeenCalled();
    });

    //UnHappy - failed to delete
    it('should throw if the timetable failed to delete', async () => {
      //Arrange
      const userTimetable = createUserTimetable();
      const timetable = createTimetable();

      mockDbResult(mockDb.select, [
        {
          UserTimetable: userTimetable,
          Timetable: timetable,
        },
      ]);

      mockDbResult(mockDb.delete, []);

      //Act + Assert
      await expect(
        service.deleteTimetable(userId, timetableId),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    //Happy - return success with successfull deletion
    it('should return success if delete succeeded', async () => {
      //Arrange
      const userTimetable = createUserTimetable();
      const timetable = createTimetable();

      mockDbResult(mockDb.select, [
        {
          UserTimetable: userTimetable,
          Timetable: timetable,
        },
      ]);

      mockDbResult(mockDb.delete, [timetable]);

      //Act
      const result = await service.deleteTimetable(userId, timetableId);

      //Assert
      expect(result).toMatchObject({ success: true });
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
}); //END_Timetable Service
