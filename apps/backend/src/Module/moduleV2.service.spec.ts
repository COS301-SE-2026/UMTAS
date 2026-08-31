import { Test } from '@nestjs/testing';

//Constants
import { userId, courseId, uniId, groupId } from '../Testing/constants';

//Actual Service imports
import { ModuleServiceV2 } from './moduleV2.service';
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';
import { GroupingService } from '../Grouping/grouping.service';
import { EventService } from '../Events/event.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  mockDbResult,
  mockTransaction,
} from '../Testing/Mocks/database.helpers';

import {
  createModule,
  createModuleDto,
  createCourse,
  createGroup,
  createCourseModule,
  createEventDto,
} from '../Testing/Factories/';

//Mock Services
import {
  createMockCourseService,
  createMockGroupingService,
  createMockEventService,
} from '../Testing/Mocks/services';

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

//DTO's

describe('ModuleServiceV2', () => {
  let service: ModuleServiceV2;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockCourseService, reset: resetCourse } = createMockCourseService();
  const { mockGroupingService, reset: resetGrouping } =
    createMockGroupingService();
  const { mockEventService, reset: resetEvent } = createMockEventService();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ModuleServiceV2,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: CourseService, useValue: mockCourseService },
        { provide: GroupingService, useValue: mockGroupingService },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get(ModuleServiceV2);
  }); //END_beforeEach

  afterEach(() => {
    resetDb();
    resetCourse();
    resetGrouping();
    resetEvent();
  }); //END_afterEach

  //Tests

  describe('Test_CreateModule', () => {
    it(`should throw if course provided doesn't exist`, async () => {
      //Arrange
      const dto = createModuleDto({ CourseID: courseId });

      mockCourseService.getById?.mockRejectedValue(new NotFoundException());

      mockTransaction(mockDb, {});

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockCourseService.getById).toHaveBeenCalled();
    });

    it('should throw if insert into modules table failed', async () => {
      //Arrange
      const dto = createModuleDto();
      const group = createGroup();

      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);

      mockTransaction(mockDb, {
        insert: [[]],
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
    });

    it('should throw if no GroupModule entry exists for group + module', async () => {
      //Arrange
      const dto = createModuleDto({
        CourseID: courseId,
        CourseModuleInfo: {
          Core: true,
          SemesterOfStudy: 'Semester 1',
          YearOfStudy: 1,
        },
      });

      const course = createCourse();
      const module = createModule();
      const group = createGroup();

      mockCourseService.getById?.mockResolvedValue(course);
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      mockTransaction(mockDb, {
        select: [[], []],
        insert: [[module]],
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw if courseModule info insert failed', async () => {
      //Arrange
      const dto = createModuleDto({
        CourseID: courseId,
        CourseModuleInfo: {
          Core: true,
          SemesterOfStudy: 'Semester 1',
          YearOfStudy: 1,
        },
      });

      const course = createCourse();
      const module = createModule();
      const group = createGroup();

      mockCourseService.getById?.mockResolvedValue(course);
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      mockTransaction(mockDb, {
        select: [
          [],
          [
            {
              GroupModuleID: 'groupModuleId',
              GroupID: group.GroupID,
              ModuleID: module.moduleID,
            },
          ],
        ],
        insert: [[module], []],
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should create module with course metadata and styling', async () => {
      //Arrange
      const dto = createModuleDto({
        CourseID: courseId,
        CourseModuleInfo: {
          Core: true,
          SemesterOfStudy: 'Semester 1',
          YearOfStudy: 2,
        },
        styling: {
          colour: '#123456',
        },
      });

      const course = createCourse();
      const module = createModule();
      const group = createGroup();
      const courseModule = createCourseModule({
        CourseID: courseId,
        GroupModuleID: 'groupModuleId',
      });

      mockCourseService.getById?.mockResolvedValue(course);
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      jest.spyOn(service as any, 'setStyling').mockResolvedValue({
        styling: dto.styling,
      });

      mockTransaction(mockDb, {
        select: [
          [],
          [
            {
              GroupModuleID: 'groupModuleId',
              GroupID: group.GroupID,
              ModuleID: module.moduleID,
            },
          ],
        ],
        insert: [[module], [courseModule]],
      });

      //Act
      const result = await service.create(userId, dto);

      //Assert
      expect(result).toMatchObject({
        ...module,
        ModuleGroupingID: group.GroupID,
        CourseModuleInfo: courseModule,
        styling: dto.styling,
      });
    });

    it('should return existing module when module code already exists', async () => {
      //Arrange
      const dto = createModuleDto({
        CourseID: courseId,
      });

      const course = createCourse({
        GroupID: groupId,
      });

      const existingModule = createModule();
      const group = createGroup({
        GroupID: groupId,
      });

      mockCourseService.getById?.mockResolvedValue(course);
      mockGroupingService.getById?.mockResolvedValue(group);

      mockTransaction(mockDb, {
        select: [[{ moduleId: existingModule.moduleID }]],
      });

      jest.spyOn(service, 'getById').mockResolvedValue(existingModule);

      //Act
      const result = await service.create(userId, dto);

      //Assert
      expect(result).toMatchObject(existingModule);
    });
  }); //END_Test_CreateModule

  describe('Test_GetAll', () => {
    it('should return empty array of modules if none found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getAll(userId, {});

      //Assert
      expect(result).toMatchObject({ modules: [] });
    });

    it('should return modules with filters', async () => {
      //Arrange
      const module1 = createModule();
      const module2 = createModule();

      mockDbResult(mockDb.select, [module1, module2]);

      mockEventService.getAllEvents?.mockResolvedValue({
        events: [],
      });

      //Act
      const result = await service.getAll(userId, {
        universityId: uniId,
        courseId,
        GroupID: groupId,
        moduleCode: 'someCode',
        userEnrollment: true,
      });

      //Assert
      expect(result).toMatchObject({
        modules: [module1, module2],
      });

      expect(mockEventService.getAllEvents).toHaveBeenCalledTimes(2);
    });

    it('should return count when Stats is true', async () => {
      //Arrange
      const module1 = createModule();
      const module2 = createModule();

      mockDbResult(mockDb.select, [module1, module2]);

      mockEventService.getAllEvents?.mockResolvedValue({
        events: [],
      });

      //Act
      const result = await service.getAll(userId, {
        Stats: true,
      });

      //Assert
      expect(result.count).toBe(2);
    });

    it('should include events for each module', async () => {
      //Arrange
      const module = createModule();

      const events = [createEventDto({}, {})];

      mockDbResult(mockDb.select, [module]);

      mockEventService.getAllEvents?.mockResolvedValue({
        events,
      });

      //Act
      const result = await service.getAll(userId, {});

      //Assert
      expect(result.modules[0]).toMatchObject({
        ...module,
        Events: events,
      });
    });
  }); //END_Test_GetAll

  describe('Test_GetByIdV2', () => {
    it('should throw if moduleId is invalid', async () => {
      //Act + Assert
      await expect(
        service.getByIdV2({
          moduleId: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if module does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(
        service.getByIdV2({
          moduleId: 'someId',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return module without userId', async () => {
      //Arrange
      const module = createModule();

      mockDbResult(mockDb.select, [module]);

      //Act
      const result = await service.getByIdV2({
        moduleId: module.moduleID,
      });

      //Assert
      expect(result).toMatchObject(module);
      expect(mockEventService.getAllEvents).not.toHaveBeenCalled();
    });

    it('should return module with styling and events when userId is provided', async () => {
      //Arrange
      const module = createModule();

      mockDbResult(mockDb.select, [module]);

      const event = createEventDto({}, {});

      mockEventService.getAllEvents?.mockResolvedValue({
        events: [event],
      });

      //Act
      const result = await service.getByIdV2({
        moduleId: module.moduleID,
        userId,
      });

      //Assert
      expect(result).toMatchObject({
        ...module,
        Events: [event],
      });

      expect(mockEventService.getAllEvents).toHaveBeenCalledWith(userId, {
        moduleId: module.moduleID,
      });
    });
  }); //END_Test_GetByIdV2

  describe('Test_EnrollToModuleV2', () => {
    it('should throw if module does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Assert
      await expect(
        service.enrollToModuleV2(userId, 'someId', {
          enroll: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return already enrolled when enroll is true', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [
          [module],
          [
            {
              ModuleID: module.moduleID,
              UserID: userId,
            },
          ],
        ],
      });

      //Act
      const result = await service.enrollToModuleV2(userId, module.moduleID, {
        enroll: true,
      });

      //Assert
      expect(result.message).toContain('already enrolled');
    });

    it('should unenroll an enrolled user', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [
          [module],
          [
            {
              ModuleID: module.moduleID,
              UserID: userId,
            },
          ],
        ],
      });

      mockDbResult(mockDb.delete, [[]]);

      //Act
      const result = await service.enrollToModuleV2(userId, module.moduleID, {
        enroll: false,
      });

      //Assert
      expect(result.message).toContain('Successfully Unenrolled');
    });

    it('should throw if enrollment insert fails', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [[module], []],
        insert: [[]],
      });

      //Act + Assert
      await expect(
        service.enrollToModuleV2(userId, module.moduleID, {
          enroll: true,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should enroll user when enroll is true', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [[module], []],
        insert: [
          [
            {
              ModuleID: module.moduleID,
              UserID: userId,
            },
          ],
        ],
      });

      //Act
      const result = await service.enrollToModuleV2(userId, module.moduleID, {
        enroll: true,
      });

      //Assert
      expect(result).toMatchObject({
        moduleID: module.moduleID,
        UserID: userId,
      });
    });

    it('should enroll user when enroll is undefined', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [[module], []],
        insert: [
          [
            {
              ModuleID: module.moduleID,
              UserID: userId,
            },
          ],
        ],
      });

      //Act
      const result = await service.enrollToModuleV2(
        userId,
        module.moduleID,
        {},
      );

      //Assert
      expect(result.message).toContain('Successfully enrolled');
    });

    it('should return already unenrolled when enroll is false', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [[module], []],
      });

      //Act
      const result = await service.enrollToModuleV2(userId, module.moduleID, {
        enroll: false,
      });

      //Assert
      expect(result.message).toContain('already unenrolled');
    });
  }); //END_Test_EnrollToModuleV2

  describe('Test_GetByExternalID', () => {
    it('should return module by external ID', async () => {
      //Arrange
      const module = createModule({ ExternalID: 'someId' });

      mockDbResult(mockDb.select, [module]);

      //Act
      const result = await service.getByExternalID('someId', courseId);

      //Assert
      expect(result).toMatchObject(module);
    });

    it('should return null if module does not exist', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act
      const result = await service.getByExternalID('nonexistent', courseId);

      //Assert
      expect(result).toBeNull();
    });
  }); //END_Test_GetByExternalID
}); //END_ModuleServiceV2
