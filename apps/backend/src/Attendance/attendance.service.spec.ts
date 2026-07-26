import { Test } from '@nestjs/testing';

//Constants
import { userId } from '../Testing/constants.spec';

//Actual Services
import { AttendanceService } from './attendance.service';
import { DatabaseService } from '../db/database.service';
import { EventService } from '../Events/event.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockTransaction } from '../Testing/Mocks/database.helpers';
import {
  createAttendance,
  createAttendanceDto,
  createEventSingleResponse,
} from '../Testing/Factories/';

//Mock Services
import { createMockEventService } from '../Testing/Mocks/services';

//Exceptions
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

//DTO's
import {} from './dto/attendance.dto';

describe('Attendance Service', () => {
  let service: AttendanceService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockEventService, reset: resetEvent } = createMockEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get(AttendanceService);
  });

  afterEach(() => {
    resetDb();
    resetEvent();
  });

  //TESTS
  //Create
  describe('Test_createAttendance', () => {
    //Un-Happy - Attendance entry already exists - return that entry
    it(`should return already existing attendance entry`, async () => {
      //Arrange
      const dto = createAttendanceDto();
      const attendance = createAttendance(dto);

      mockTransaction(mockDb, {
        select: [
          [attendance], //findAttendance
        ],
      });

      //Act
      const result = await service.createAttendance(userId, dto);

      //Assert
      expect(result).toMatchObject(attendance);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    //Un-Happy - throw if event doesn't exist
    it('should throw if event does not exist', async () => {
      //Arrange
      const dto = createAttendanceDto();

      mockTransaction(mockDb, {
        select: [
          [], //findAttendance
        ],
      });

      mockEventService.getById?.mockRejectedValue(new NotFoundException());

      //Act + Assert
      await expect(service.createAttendance(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEventService.getById).toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    //Un-Happy - failed to create new attendance record
    it('should throw if insert of attendance failed', async () => {
      //Arrange
      const dto = createAttendanceDto();

      mockTransaction(mockDb, {
        select: [
          [], //findAttendance
        ],
        insert: [[]], //failed insert
      });

      const event = createEventSingleResponse();
      mockEventService.getById?.mockResolvedValue(event);

      //Act + Assert
      await expect(service.createAttendance(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockEventService.getById).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    //Happy
    it('should successfully create new attendance entry', async () => {
      const dto = createAttendanceDto();
      const attendance = createAttendance(dto);

      mockTransaction(mockDb, {
        select: [
          [], //findAttendance
        ],
        insert: [[attendance]], //failed insert
      });

      const event = createEventSingleResponse();
      mockEventService.getById?.mockResolvedValue(event);

      //Act
      const result = await service.createAttendance(userId, dto);

      //Assert
      expect(result).toMatchObject(attendance);
      expect(mockEventService.getById).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  //getAll
  describe('Test_getAllAttendanceRecords', () => {}); //END_Test_getAllAttendanceRecords
}); //END_Attendance Service
