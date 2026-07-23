import { BuilderService } from './builder.service';

import { Test } from '@nestjs/testing';

//Constants
import { userId, moduleId, uniId, courseId } from '../Testing/constants.spec';

//Mock services
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import {
  createMockUniversityService,
  createMockCourseService,
  createMockModuleService,
} from '../Testing/Mocks/services';
import { DatabaseService } from '../db/database.service';
import { UniversityService } from '../University/university.service';
import { CourseService } from '../Course/course.service';
import { ModuleService } from '../Module/module.service';

//Mock functions on db
import { mockTransaction } from '../Testing/Mocks';

//Factories
import { createModule } from '../Testing/Factories';
import { ForbiddenException } from '@nestjs/common';

describe('BuilderService', () => {
  let service: BuilderService;

  //Define mock services
  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockCourseService, reset: resetCourse } = createMockCourseService();
  const { mockModuleService, reset: resetModules } = createMockModuleService();

  //Before
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BuilderService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: CourseService, useValue: mockCourseService },
        { provide: ModuleService, useValue: mockModuleService },
      ],
    }).compile();

    service = module.get(BuilderService);
  }); //END_BeforeEach

  //AfterEach
  afterEach(() => {
    resetDb();
    resetUni();
    resetCourse();
    resetModules();
  }); //END_afterEach

  //TESTS

  //Create
  describe('Test_Create', () => {
    it('should create userOwned: university | course | module', async () => {
      //ARRANGE
      //doUserUniCheck
      mockTransaction(mockDb, {
        select: [[]],
        insert: [
          [
            {
              //unirole
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            },
          ],
          [
            {
              //moduleenrollment
              UserID: userId,
              ModuleID: moduleId,
            },
          ],
        ],
      });
      //createUserUni
      mockUniversityService.getByName!.mockResolvedValue(null);
      mockUniversityService.create!.mockResolvedValue({
        UniversityID: uniId,
        UniversityName: 'somename',
      });
      //END_createUserUni
      mockCourseService.getAll!.mockResolvedValue({ courses: [] });
      //createUserCourse
      mockCourseService.create!.mockResolvedValue({
        CourseID: courseId,
        CourseName: 'somecoursename',
        UniversityID: uniId,
      });
      //END_createUserCourse
      //END_doUserUniCheck

      const moduleDto = createModule({
        moduleID: moduleId,
      });

      mockModuleService.create!.mockResolvedValue(moduleDto);

      //Assert
      const result = await service.createModule(userId, moduleDto);

      //Assert
      expect(mockUniversityService.getByName).toHaveBeenCalledWith(
        `user_${userId.slice(0, 25)}`,
        mockDb,
      );
      expect(mockCourseService.getAll).toHaveBeenCalledWith(
        {
          UniversityID: uniId,
        },
        mockDb,
      );
      expect(mockModuleService.create).toHaveBeenCalledWith(
        userId,
        {
          moduleCode: moduleDto.moduleCode,
          moduleName: moduleDto.moduleName,
          moduleDescription: moduleDto.moduleDescription,
          CourseID: courseId,
          styling: undefined,
        },
        mockDb,
      );
      expect(result).toMatchObject(moduleDto);
    });

    it('should create userOwned: module || university and course already defined', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [
          [
            {
              //uniRole
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            },
          ],
        ],
        insert: [
          [
            {
              //moduleEnrollment
              ModuleID: moduleId,
              UserID: userId,
            },
          ],
        ],
      });
      mockCourseService.getAll!.mockResolvedValue({
        courses: [
          {
            CourseID: courseId,
            CourseName: 'somename',
            UniversityID: uniId,
          },
        ],
      });
      const moduleDto = createModule({
        moduleID: moduleId,
      });
      const createModuleDto = {
        moduleCode: moduleDto.moduleCode,
        moduleName: moduleDto.moduleName,
        moduleDescription: moduleDto.moduleDescription,
        styling: { colour: 'black' },
      };
      mockModuleService.create!.mockResolvedValue({
        ...createModuleDto,
        moduleID: moduleId,
      });

      //Act
      const result = await service.createModule(userId, createModuleDto);

      //Assert
      expect(mockCourseService.getAll).toHaveBeenCalledWith(
        {
          UniversityID: uniId,
        },
        mockDb,
      );
      expect(mockModuleService.create).toHaveBeenCalledWith(
        userId,
        {
          ...createModuleDto,
          CourseID: courseId,
        },
        mockDb,
      );
      expect(result).toMatchObject({
        moduleID: moduleDto.moduleID,
        moduleName: moduleDto.moduleName,
        styling: createModuleDto.styling,
      });
    });
  }); //END_Test_Create

  //GetAll
  describe('Test_GetAll', () => {
    it('should return empty array of modules', async () => {
      mockTransaction(mockDb, {
        select: [
          [
            {
              //UniRole
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            },
          ],
        ],
      });
      mockCourseService.getAll!.mockResolvedValue({
        courses: [
          {
            CourseID: courseId,
            CourseName: 'somename',
            UniversityID: uniId,
          },
        ],
      });
      mockModuleService.getAll!.mockResolvedValue({ modules: [] });

      const result = await service.getAllModules(userId);

      expect(mockCourseService.getAll).toHaveBeenCalledWith(
        {
          UniversityID: uniId,
        },
        mockDb,
      );
      expect(result).toMatchObject({ modules: [] });
    });

    it('should return array of modules', async () => {
      mockTransaction(mockDb, {
        select: [
          [
            {
              //UniRole
              UserID: userId,
              UniversityID: uniId,
              role: 'STUDENT_OWNED',
            },
          ],
        ],
      });
      mockCourseService.getAll!.mockResolvedValue({
        courses: [
          {
            CourseID: courseId,
            CourseName: 'somename',
            UniversityID: uniId,
          },
        ],
      });
      const module1 = createModule();
      const module2 = createModule();

      mockModuleService.getAll!.mockResolvedValue({
        modules: [module1, module2],
      });

      const result = await service.getAllModules(userId);

      expect(mockCourseService.getAll).toHaveBeenCalledWith(
        {
          UniversityID: uniId,
        },
        mockDb,
      );
      expect(result).toMatchObject({ modules: [module1, module2] });
    });
  }); //END_Test_GetAll

  //getById
  describe('Test_GetById', () => {
    it('should return module by id', async () => {
      //Arrange
      const module = createModule();

      mockModuleService.getById!.mockResolvedValue(module);

      //Act
      const result = await service.getModuleById(userId, module.moduleID);

      //Assert
      expect(result).toMatchObject(module);
    });
  }); //END_Test_GetById

  //Update
  describe('Test_Update', () => {
    it('should fail if user is trying to update module they do not own', async () => {
      mockModuleService.moduleOwnershipCheck!.mockResolvedValue(false);

      await expect(service.updateModule(userId, moduleId, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update module that user owns', async () => {
      mockModuleService.moduleOwnershipCheck!.mockResolvedValue(true);

      const module = createModule({ moduleID: moduleId });
      const updateModuleDto = {
        moduleCode: module.moduleCode,
        moduleName: module.moduleName,
        moduleDescription: module.moduleDescription,
        styling: { colour: 'black' },
      };
      const newModule = createModule({
        moduleCode: updateModuleDto.moduleCode,
        moduleName: updateModuleDto.moduleName,
        moduleDescription: updateModuleDto.moduleDescription,
      });

      mockModuleService.update!.mockResolvedValue({
        ...newModule,
        styling: updateModuleDto.styling,
      });

      const result = await service.updateModule(
        userId,
        moduleId,
        updateModuleDto,
      );

      expect(result).toMatchObject({
        ...newModule,
        styling: updateModuleDto.styling,
      });
    });
  }); //END_Test_Update

  // //Delete
  describe('Test_Delete', () => {
    it('should throw if user does not own module', async () => {
      mockModuleService.moduleOwnershipCheck!.mockResolvedValue(false);

      await expect(service.deleteModule(userId, moduleId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete module that user owns', async () => {
      mockModuleService.moduleOwnershipCheck!.mockResolvedValue(true);
      mockModuleService.deleteById!.mockResolvedValue({
        moduleCode: 'someCode',
        success: true,
      });

      const result = await service.deleteModule(userId, moduleId);

      expect(result).toMatchObject({
        moduleCode: 'someCode',
        success: true,
      });
    });
  }); //END_Test_Delete
}); //END_BuilderService
