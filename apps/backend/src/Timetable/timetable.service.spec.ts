import { Test } from '@nestjs/testing';

//Constants
import { userId } from '../Testing/constants.spec';

//Actual Services
import { TimetableService } from './timetable.service';
import { DatabaseService } from '../db/database.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockTransaction } from '../Testing/Mocks/database.helpers';
import {
  createCreateTimetableDto,
  createEvent,
  createTimetable,
  createUserTimetable,
} from '../Testing/Factories/';

//Mock Services
import {} from '../Testing/Mocks/services';

//Exceptions
import { InternalServerErrorException } from '@nestjs/common';

//DTO's
import { TimetableResponseDto } from './dto/timetable.dto';

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
}); //END_Timetable Service
