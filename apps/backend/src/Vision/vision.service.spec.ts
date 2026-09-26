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
  createSessionInferenceResult,
  createUpdateVisionSessionDto,
  createVisionSession,
  createVisionSessionDto,
  createVisionSessionQueryDto,
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

  //getAll
  describe('Test_getAll', () => {
    it('should return empty array when no sessions found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAll(createVisionSessionQueryDto());

      //Assert
      expect(result).toEqual({ sessions: [] });
    });

    it('should return sessions and apply filters', async () => {
      //Arrange
      const sessionA = createVisionSession({ SessionName: 'Lecture A' });
      const sessionB = createVisionSession({ SessionName: 'Lecture B' });

      const query = createVisionSessionQueryDto({
        moduleId: moduleId,
        eventId: 'event-1',
        from: '2026-01-01',
        to: '2026-12-31',
        search: '  lecture  ',
      });

      mockDbResult(mockDb.select, [sessionA, sessionB]);

      //Act
      const result = await service.getAll(query);

      //Assert
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].SessionID).toBe(sessionA.SessionID);
      expect(result.sessions[1].SessionID).toBe(sessionB.SessionID);
      expect(result.sessions[0].Data).toEqual(sessionA.Data);
    });
  }); //END_Test_getAll

  //Update
  describe('Test_update', () => {
    const sessionId = 'session-1';

    it('should throw InternalServerErrorException when update fails', async () => {
      //Arrange
      const dto = createUpdateVisionSessionDto({ SessionName: 'New Name' });
      const existing = createVisionSessionDto({ SessionID: sessionId });
      jest.spyOn(service, 'getById').mockResolvedValue({ session: existing });
      jest
        .spyOn(service as any, 'validateUpdateInput')
        .mockResolvedValue({ SessionName: 'New Name' });
      mockTransaction(mockDb, {
        update: [[]],
      });

      //Act + Assert
      await expect(service.update(sessionId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should return early when nothing to update', async () => {
      //Arrange
      const dto = createUpdateVisionSessionDto();
      const existing = createVisionSessionDto({ SessionID: sessionId });
      jest.spyOn(service, 'getById').mockResolvedValue({ session: existing });
      jest.spyOn(service as any, 'validateUpdateInput').mockResolvedValue({});
      mockTransaction(mockDb, {});

      //Act
      const result = await service.update(sessionId, dto);

      //Assert
      expect(result.session).toEqual(existing);
      expect(result.message).toBe('Nothing to update for session');
    });

    it('should return the updated session', async () => {
      //Arrange
      const dto = createUpdateVisionSessionDto({ SessionName: 'New Name' });
      const existing = createVisionSessionDto({ SessionID: sessionId });
      const updated = createVisionSession({
        SessionID: sessionId,
        SessionName: 'New Name',
      });
      jest.spyOn(service, 'getById').mockResolvedValue({ session: existing });
      jest
        .spyOn(service as any, 'validateUpdateInput')
        .mockResolvedValue({ SessionName: 'New Name' });

      mockTransaction(mockDb, {
        update: [[updated]],
      });

      //Act
      const result = await service.update(sessionId, dto);

      //Assert
      expect(result.message).toBe('Vision session updated successfully');
      expect(result.session.SessionID).toBe(updated.SessionID);
      expect(result.session.SessionName).toBe('New Name');
      expect(result.session.Data).toEqual(updated.Data);
    });
  }); //END_Test_update

  //Delete
  describe('Test_delete', () => {
    it('should throw NotFoundException when session does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        delete: [[]],
      });

      //Act + Assert
      await expect(service.delete('session-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the deleted session', async () => {
      //Arrange
      const session = createVisionSession({
        SessionID: 'session-1',
        SessionName: 'Lecture 1',
      });
      mockTransaction(mockDb, {
        delete: [[session]],
      });

      //Act
      const result = await service.delete(session.SessionID);

      //Assert
      expect(result).toEqual({
        SessionID: session.SessionID,
        SessionName: session.SessionName,
        success: true,
      });
    });
  }); //END_Test_delete

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

  describe('Test_validateUpdateInput', () => {
    const existing = createVisionSessionDto({
      SessionID: 'session-1',
      ModuleID: moduleId,
      SessionName: 'Original Name',
      SessionDsc: 'Original description',
      Date: '2026-12-15',
      EventID: null,
    });

    it('should return empty object when input has no fields', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto();

      //Act
      const result = await (service as any).validateUpdateInput(
        existing,
        input,
        mockDb,
      );

      //Assert
      expect(result).toEqual({});
    });

    it('should throw BadRequestException when SessionName is empty after trim', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto({ SessionName: '   ' });

      //Act + Assert
      await expect(
        (service as any).validateUpdateInput(existing, input, mockDb),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate event when EventID provided', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto({ EventID: 'event-1' });
      const eventSpy = jest
        .spyOn(service as any, 'validateEventBelongsToModule')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue(undefined);

      //Act
      const result = await (service as any).validateUpdateInput(
        existing,
        input,
        mockDb,
      );

      //Assert
      expect(result.EventID).toBe('event-1');
      expect(eventSpy).toHaveBeenCalledWith('event-1', moduleId, mockDb);
    });

    it('should set EventID to null without validating when null provided', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto({ EventID: null });
      const eventSpy = jest.spyOn(
        service as any,
        'validateEventBelongsToModule',
      );
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue(undefined);

      //Act
      const result = await (service as any).validateUpdateInput(
        existing,
        input,
        mockDb,
      );

      //Assert
      expect(result.EventID).toBeNull();
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when a duplicate exists with a different ID', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto({ SessionName: 'New Name' });
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue({ sessionId: 'other-session' });

      //Act + Assert
      await expect(
        (service as any).validateUpdateInput(existing, input, mockDb),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow identity change when the duplicate is the same session', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto({ SessionName: 'New Name' });
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue({ sessionId: existing.SessionID });

      //Act
      const result = await (service as any).validateUpdateInput(
        existing,
        input,
        mockDb,
      );

      //Assert
      expect(result.SessionName).toBe('New Name');
    });

    it('should return all validated fields when all provided and unique', async () => {
      //Arrange
      const input = createUpdateVisionSessionDto({
        SessionName: '  New Name  ',
        SessionDsc: '  New desc  ',
        Data: createSessionInferenceResult({ questions_asked: 5 }),
        EventID: 'event-1',
        Date: '2026-12-20',
      });
      jest
        .spyOn(service as any, 'validateEventBelongsToModule')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'findDuplicateSession')
        .mockResolvedValue(undefined);

      //Act
      const result = await (service as any).validateUpdateInput(
        existing,
        input,
        mockDb,
      );

      //Assert
      expect(result).toEqual({
        SessionName: 'New Name',
        SessionDsc: 'New desc',
        Data: input.Data,
        EventID: 'event-1',
        Date: '2026-12-20',
      });
    });
  }); //END_Test_validateUpdateInput

  describe('Test_validateDate', () => {
    it('should throw BadRequestException when date is invalid', () => {
      //Act + Assert
      expect(() => (service as any).validateDate('not-a-date')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when date is in the past', () => {
      //Act + Assert
      expect(() => (service as any).validateDate('2020-01-01')).toThrow(
        BadRequestException,
      );
    });

    it('should not throw for a valid future date', () => {
      //Act + Assert
      expect(() => (service as any).validateDate('2026-12-01')).not.toThrow();
    });
  }); //END_Test_validateDate
}); //END_VisionService
