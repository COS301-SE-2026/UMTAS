import { Test } from '@nestjs/testing';

//Constants
import { moduleId } from '../Testing/constants';

//Actual Service imports
import { DatabaseService } from '../db/database.service';
import { ModuleServiceV2 } from '../Module/moduleV2.service';
import { VisionService } from './vision.service';

//Mock Database and factories
import {
  createCreateVisionSessionInput,
  createVisionSession,
} from '../Testing/Factories/';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';
import { createMockDatabase } from '../Testing/Mocks/database.mock';

//Mock Services
import { createMockModuleServiceV2 } from '../Testing/Mocks/services';

//Exceptions
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('VisionService', () => {
  let service: VisionService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockModuleServiceV2, reset: resetModuleService } =
    createMockModuleServiceV2();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VisionService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: ModuleServiceV2, useValue: mockModuleServiceV2 },
      ],
    }).compile();

    service = module.get(VisionService);
  });

  afterEach(() => {
    resetDb();
    resetModuleService();
    jest.restoreAllMocks();
  });

  // Tests

  //Create
  describe('Test_create', () => {
    it('should throw InternalServerErrorException when insert returns no row', async () => {
      //Arrange
      const dto = createCreateVisionSessionInput();
      jest.spyOn(service as any, 'validateCreateInput').mockResolvedValue(dto);
      mockTransaction(mockDb, { insert: [[]] });

      //Act + Assert
      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should insert a session and return it with a success message', async () => {
      //Arrange
      const dto = createCreateVisionSessionInput();
      const session = createVisionSession({
        ModuleID: dto.ModuleID,
        Date: dto.Date,
        SessionName: dto.SessionName,
      });
      jest.spyOn(service as any, 'validateCreateInput').mockResolvedValue(dto);
      mockTransaction(mockDb, { insert: [[session]] });

      //Act
      const result = await service.create(dto);

      //Assert
      expect(result.message).toBe('Vision session created successfully');
      expect(result.session.SessionID).toBe(session.SessionID);
      expect(result.session.ModuleID).toBe(session.ModuleID);
      expect(result.session.SessionName).toBe(session.SessionName);
      expect(result.session.Data).toEqual(session.Data);
    });
  }); //END_Test_create

  //GetById
  describe('Test_getById', () => {
    it('should throw NotFoundException when no session found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById('session-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the session', async () => {
      //Arrange
      const session = createVisionSession();
      mockDbResult(mockDb.select, [session]);

      //Act
      const result = await service.getById(session.SessionID);

      //Assert
      expect(result.session.SessionID).toBe(session.SessionID);
      expect(result.session.ModuleID).toBe(session.ModuleID);
      expect(result.session.SessionName).toBe(session.SessionName);
      expect(result.session.Date).toBe(session.Date);
      expect(result.session.Data).toEqual(session.Data);
    });
  }); //END_Test_getById

  //Helpers

  describe('Test_validateCreateInput', () => {
    it('should throw BadRequestException when date is in the past', async () => {
      //Arrange
      const input = createCreateVisionSessionInput({
        Date: '2020-01-01',
      });
      jest
        .spyOn(mockModuleServiceV2, 'getByIdV2')
        .mockResolvedValue(undefined as any);

      //Act + Assert
      await expect(
        (service as any).validateCreateInput(input, mockDb),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate event when EventID is provided', async () => {
      //Arrange
      const input = createCreateVisionSessionInput({
        EventID: 'event-1',
      });
      jest
        .spyOn(mockModuleServiceV2, 'getByIdV2')
        .mockResolvedValue(undefined as any);
      const eventSpy = jest
        .spyOn(service as any, 'validateEventBelongsToModule')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue(undefined);

      //Act
      await (service as any).validateCreateInput(input, mockDb);

      //Assert
      expect(eventSpy).toHaveBeenCalledWith('event-1', input.ModuleID, mockDb);
    });

    it('should throw ConflictException when a duplicate session exists', async () => {
      //Arrange
      const input = createCreateVisionSessionInput();
      jest
        .spyOn(mockModuleServiceV2, 'getByIdV2')
        .mockResolvedValue(undefined as any);
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue({ sessionId: 'session-1' });

      //Act + Assert
      await expect(
        (service as any).validateCreateInput(input, mockDb),
      ).rejects.toThrow(ConflictException);
    });

    it('should trim SessionDsc when provided and null it when absent', async () => {
      //Arrange
      const withDesc = createCreateVisionSessionInput({
        SessionDsc: '  description  ',
      });
      const withoutDesc = createCreateVisionSessionInput({
        SessionDsc: undefined,
      });
      jest
        .spyOn(mockModuleServiceV2, 'getByIdV2')
        .mockResolvedValue(undefined as any);
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue(undefined);

      //Act
      await (service as any).validateCreateInput(withDesc, mockDb);
      await (service as any).validateCreateInput(withoutDesc, mockDb);

      //Assert
      expect(withDesc.SessionDsc).toBe('description');
      expect(withoutDesc.SessionDsc).toBeNull();
    });

    it('should return input when all checks pass', async () => {
      //Arrange
      const input = createCreateVisionSessionInput({
        SessionDsc: null,
        EventID: null,
      });
      jest
        .spyOn(mockModuleServiceV2, 'getByIdV2')
        .mockResolvedValue(undefined as any);
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue(undefined);

      //Act
      const result = await (service as any).validateCreateInput(input, mockDb);

      //Assert
      expect(result).toBe(input);
      expect(mockModuleServiceV2.getByIdV2).toHaveBeenCalledWith({
        moduleId: input.ModuleID,
        tx: mockDb,
      });
    });
  }); //END_Test_validateCreateInput

  describe('Test_validateEventBelongsToModule', () => {
    it('should throw NotFoundException when the event does not belong to the module', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(
        (service as any).validateEventBelongsToModule(
          'event-1',
          moduleId,
          mockDb,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should resolve when the event belongs to the module', async () => {
      //Arrange
      mockDbResult(mockDb.select, [{ eventId: 'event-1' }]);

      //Act + Assert
      await expect(
        (service as any).validateEventBelongsToModule(
          'event-1',
          moduleId,
          mockDb,
        ),
      ).resolves.toBeUndefined();
    });
  }); //END_Test_validateEventBelongsToModule

  describe('Test_findDuplicateSession', () => {
    it('should return undefined when no session matches', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await (service as any).findDuplicateSession(
        moduleId,
        'Test Session',
        '2026-12-01',
        mockDb,
      );

      //Assert
      expect(result).toBeUndefined();
    });

    it('should return the matching session', async () => {
      //Arrange
      mockDbResult(mockDb.select, [{ sessionId: 'session-1' }]);

      //Act
      const result = await (service as any).findDuplicateSession(
        moduleId,
        'Test Session',
        '2026-12-01',
        mockDb,
      );

      //Assert
      expect(result).toEqual({ sessionId: 'session-1' });
    });
  }); //END_Test_findDuplicateSession
}); //END_VisionService
