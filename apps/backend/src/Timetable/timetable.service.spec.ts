import { Test } from '@nestjs/testing';

//Constants
import { timetableId, userId } from '../Testing/constants.spec';

//Actual Services
import { TimetableService } from './timetable.service';
import { DatabaseService } from '../db/database.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  createCreateTimetableDto,
  createEvent,
  createTimetable,
  createUserTimetable,
} from '../Testing/Factories/';

//Mock Services
import {} from '../Testing/Mocks/services';

//Exceptions
import {
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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TimetableService,
        { provide: DatabaseService, useValue: { db: mockDb } },
      ],
    }).compile();

    service = module.get(TimetableService);
  });

  afterEach(() => {
    resetDb();
  });

  //TESTS
  //CREATE
  describe('Test_createTimetable', () => {
    //UnHappy - throw if insert failed
    it('should throw if Timetable insert failed', async () => {
      //Arrange
      const dto = createCreateTimetableDto();

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
}); //END_Timetable Service
