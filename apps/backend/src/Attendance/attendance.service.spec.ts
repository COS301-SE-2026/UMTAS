import { Test } from '@nestjs/testing';

//Constants
import { attendanceId, userId } from '../Testing/constants.spec';

//Actual Services
import { AttendanceService } from './attendance.service';
import { DatabaseService } from '../db/database.service';
import { EventService } from '../Events/event.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import {
  createAttendance,
  createAttendanceDto,
  createEventSingleResponse,
  createUpdateAttendanceDto,
} from '../Testing/Factories/';

//Mock Services
import { createMockEventService } from '../Testing/Mocks/services';

//Exceptions
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

//DTO's
import {
  AttendanceFilters,
  AttendanceListResponse,
  deleteAttendanceResponse,
} from './dto/attendance.dto';

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
  describe('Test_getAllAttendanceRecords', () => {
    //UnHappy - return empty array of attendanceList if none found
    it('should return empty attendanceList', async () => {
      //Arrange
      const expected: AttendanceListResponse = {
        attendanceList: [],
      };

      mockTransaction(mockDb, {
        select: [
          [], //no attendance records
        ],
      });

      //Act
      const result = await service.getAllAttendanceRecords(userId);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalled();
    });

    //Happy - return records
    it('should return attendanceList with records', async () => {
      //Arrange
      const a1 = createAttendance();
      const a2 = createAttendance();
      const expected: AttendanceListResponse = {
        attendanceList: [a1, a2],
      };

      const dto: AttendanceFilters = {
        eventID: 'someID',
        eventDate: 'someDate',
        state: 'ATTENDING',
        AlsoFilterByUser: true,
      };

      mockTransaction(mockDb, {
        select: [
          [a1, a2], //records exist
        ],
      });

      //Act
      const result = await service.getAllAttendanceRecords(userId, dto);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.select).toHaveBeenCalled();
    });
  }); //END_Test_getAllAttendanceRecords

  //getById
  describe('Test_getById', () => {
    //UnHappy - throw if not found
    it('should throw if attendance does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(attendanceId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDb.select).toHaveBeenCalled();
    });

    //Happy - return record
    it('should successfully return attendance entry by ID', async () => {
      //Arrange
      const attendance = createAttendance();
      mockDbResult(mockDb.select, [attendance]);

      //Act
      const result = await service.getById(attendanceId);

      //Assert
      expect(result).toMatchObject(attendance);
      expect(mockDb.select).toHaveBeenCalled();
    });
  }); //END_Test_getById

  //update
  describe('Test_updateAttendanceRecord', () => {
    //UnHappy - doesn't exist
    it('should throw if attendance record does not exist', async () => {
      //Arrange
      const dto = createUpdateAttendanceDto();
      const spy = jest
        .spyOn(service, 'getById')
        .mockRejectedValue(new NotFoundException());

      //Act + Assert
      await expect(
        service.updateAttendanceRecord(attendanceId, dto),
      ).rejects.toThrow(NotFoundException);
      expect(spy).toHaveBeenCalled();
    });

    //UnHappy - nothing to update
    it('should return early if nothing to update', async () => {
      //Arrange
      const dto = createUpdateAttendanceDto();
      const attendance = createAttendance(dto);
      const spy = jest.spyOn(service, 'getById').mockResolvedValue(attendance);

      mockTransaction(mockDb, {});

      //Act
      const result = await service.updateAttendanceRecord(attendanceId, dto);

      //Assert
      expect(result).toMatchObject(attendance);
      expect(spy).toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    //UnHappy - update failed
    it('should return early if nothing to update', async () => {
      //Arrange
      const dto = createUpdateAttendanceDto();
      const attendance = createAttendance();
      const spy = jest.spyOn(service, 'getById').mockResolvedValue(attendance);

      mockTransaction(mockDb, {
        update: [[]], //update failed
      });

      //Act + Assert
      await expect(
        service.updateAttendanceRecord(attendanceId, dto),
      ).rejects.toThrow(InternalServerErrorException);
      expect(spy).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });

    //Happy - udpate every field of the attendance record
    it('should update each field of the attendance entry', async () => {
      //Arrange
      const dto = createUpdateAttendanceDto();
      console.log(`Here: [${JSON.stringify(dto)}]`);
      const attendance = createAttendance();
      const spy = jest.spyOn(service, 'getById').mockResolvedValue(attendance);

      const newAttendance = createAttendance(dto);
      mockTransaction(mockDb, {
        update: [[newAttendance]], //update
      });

      //Act
      const result = await service.updateAttendanceRecord(attendanceId, dto);

      //Assert
      expect(result).toMatchObject(newAttendance);
      expect(spy).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });
  }); //END_Test_updateAttendanceRecord

  //Delete
  describe('Test_deleteAttendance', () => {
    //UnHappy - success = false
    it('should return success as false if failed', async () => {
      //Arrange
      const expected: deleteAttendanceResponse = {
        success: false,
      };
      mockDbResult(mockDb.delete, []);

      //Act
      const result = await service.deleteAttendance(attendanceId);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    //Happy - success = true
    it('should return success as true if deleted', async () => {
      //Arrange
      const expected: deleteAttendanceResponse = {
        success: true,
      };
      const attendance = createAttendance();
      mockDbResult(mockDb.delete, [attendance]);

      //Act
      const result = await service.deleteAttendance(attendanceId);

      //Assert
      expect(result).toMatchObject(expected);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
}); //END_Attendance Service
