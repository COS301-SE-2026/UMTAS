import { Test } from '@nestjs/testing';

//Constants
import { userId, courseId, uniId, groupId } from '../Testing/constants.spec';

//Table imports
// import { modules, CourseModule, ModuleStyling } from '../entities/index';

//Actual Service imports
import { ModuleService } from './module.service';
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';
import { GroupingService } from '../Grouping/grouping.service';

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
} from '../Testing/Factories/';

//Mock Services
import {
  createMockCourseService,
  createMockGroupingService,
} from '../Testing/Mocks/services';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('ModuleService', () => {
  let service: ModuleService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockCourseService, reset: resetCourse } = createMockCourseService();
  const { mockGroupingService, reset: resetGrouping } =
    createMockGroupingService();

  // const existing = createModule();
  // const resultObject = { ...existing, styling: null };

  let setStylingSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ModuleService,
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: CourseService, useValue: mockCourseService },
        { provide: GroupingService, useValue: mockGroupingService },
      ],
    }).compile();

    service = module.get(ModuleService);

    setStylingSpy = jest.spyOn(service, 'setStyling');
  });

  afterEach(() => {
    resetDb();
    resetCourse();
    resetGrouping();

    setStylingSpy.mockRestore();
  });

  //TESTS
  //Create
  describe('Test_CreateModule', () => {
    //UnHappy - if course provided and doesnt exist
    it(`should throw if course provided doesn't exist`, async () => {
      //Arrange
      mockCourseService.getById?.mockRejectedValue(new NotFoundException());
      const dto = createModuleDto({ CourseID: 'nonExistentCourse' });

      mockTransaction(mockDb, {});

      //Act + assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockCourseService.getById).rejects.toThrow(NotFoundException);
    });

    //UnHappy - duplicate module code for module grouping
    it(`should throw if module code already exists for that moduleGrouping`, async () => {
      //Arrange
      const group = createGroup();
      const course = createCourse({ GroupID: group.GroupID });
      // const module = createModule();
      const dto = createModuleDto({ CourseID: course.CourseID });

      mockCourseService.getById?.mockResolvedValue(course);

      mockGroupingService.getById?.mockResolvedValue(group);

      mockTransaction(mockDb, {
        select: [[{ moduleCode: dto.moduleCode }]], //existingModuleCodeFormoduleGrouping
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockGroupingService.getById).toHaveBeenCalled();
    });

    //UnHappy - failed to create new module
    it('should throw if insert into modules table failed', async () => {
      //Arrange
      // const module = createModule();
      const dto = createModuleDto();

      const group = createGroup();
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);

      mockTransaction(mockDb, {
        insert: [[]], //create
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
    });

    //UnHappy - CourseModule create but no join entry for module to moduleGrouping exists
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
      mockCourseService.getById?.mockResolvedValue(course); //groupID will be null

      const module = createModule();
      const group = createGroup();
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.getById?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      mockTransaction(mockDb, {
        select: [
          [], //existingModuleCodeForModuleGrouping
          [], //groupModule
        ],
        insert: [[module]],
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
      expect(mockGroupingService.getById).toHaveBeenCalled();
      expect(mockGroupingService.populateGroup).toHaveBeenCalled();
    });

    //UnHappy - CourseModule create but the metadata insert failed
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
      mockCourseService.getById?.mockResolvedValue(course); //groupID will be null

      const module = createModule();
      const group = createGroup();
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.getById?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      mockTransaction(mockDb, {
        select: [
          [], //existingModuleCodeForModuleGrouping
          [
            {
              GroupModuleID: 'testId',
              GroupID: group.GroupID,
              ModuleID: module.moduleID,
            },
          ], //groupModule
        ],
        insert: [[module], []],
      });

      //Act + Assert
      await expect(service.create(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
      expect(mockGroupingService.getById).toHaveBeenCalled();
      expect(mockGroupingService.populateGroup).toHaveBeenCalled();
    });

    //Happy - course provided but with no group
    it('should create group for course and create module', async () => {
      //Arrange
      const dto = createModuleDto({ CourseID: courseId, styling: null });

      const course = createCourse();
      mockCourseService.getById?.mockResolvedValue(course); //groupID will be null

      const module = createModule();
      const group = createGroup();
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.getById?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      mockTransaction(mockDb, {
        select: [[]], //existingModuleCodeForModuleGrouping
        insert: [[module]],
      });

      //Act
      const result = await service.create(userId, dto);

      //Assert
      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
      expect(mockGroupingService.getById).toHaveBeenCalled();
      expect(mockGroupingService.populateGroup).toHaveBeenCalled();

      expect(result).toMatchObject(module);
    });

    //Happy - no course/group provided -> create group and module
    it('should create group and module if no course/group provided', async () => {
      //Arrange
      const module = createModule();
      const dto = createModuleDto();

      const group = createGroup();
      mockGroupingService.createModuleGrouping?.mockResolvedValue(group);
      mockGroupingService.populateGroup?.mockResolvedValue({
        ...group,
        modules: [module.moduleID],
      });

      mockTransaction(mockDb, {
        insert: [[module]], //create
      });

      //Act
      const result = await service.create(userId, dto);

      //Assert
      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
      expect(mockGroupingService.populateGroup).toHaveBeenCalled();

      expect(result).toMatchObject(module);
    });
  }); //END_Test_CreateModule

  // getAll
  describe('Test_GetAll', () => {
    //Should return empty array of modules
    it('should return empty array of modules if none found', async () => {
      //Arrange
      mockDbResult(mockDb.selectDistinctOn, []);

      //Act
      const result = await service.getAll(userId, {});

      //Assert
      expect(result).toMatchObject({ modules: [] });
    });

    //Should return array with modules in them
    it('should return array of modules found', async () => {
      //Arrange
      const module1 = createModule();
      const module2 = createModule();

      mockDbResult(mockDb.selectDistinctOn, [module1, module2]);

      //Act
      const result = await service.getAll(userId, {
        universityId: uniId,
        courseId,
        GroupID: groupId,
        moduleCode: 'someCode',
        userEnrollment: true,
      });

      //Assert
      expect(result).toMatchObject({ modules: [module1, module2] });
    });
  }); //END_Test_GetAll

  // //END_getAll

  // //getById
  // describe('Test_getById', () => {
  //   it('should return module by id', async () => {
  //     mockSequentialResults(mockDb.select, [[resultObject]]);

  //     const result = await service.getById(userId, existing.moduleID);

  //     expect(result).toEqual(resultObject);
  //   });
  // });//END_Test_getById
  // //END_getById

  // //Update
  // describe('Test_updateModule', () => {
  //   it('should update fields - no styling', async () => {
  //     const updatedModule = createModule({
  //       moduleName: 'NewModuleName',
  //       moduleCode: 'NewModuleCode',
  //       moduleDescription: 'newModuleDescription',
  //     });

  //     const updatedResultObject = { ...resultObject, ...updatedModule };

  //     mockSequentialResults(mockDb.select, [
  //       [{ ...resultObject, CourseID: courseId }],
  //       [],
  //     ]);
  //     mockSequentialResults(mockDb.update, [[updatedResultObject]]);

  //     const result = await service.update(
  //       userId,
  //       existing.moduleID,
  //       updatedModule,
  //     );

  //     expect(result).toMatchObject(updatedResultObject);
  //     expect(setStylingSpy).not.toHaveBeenCalled();
  //   });

  //   //Update only styling - create stylling entity
  //   it('should update only the styling for a module - styling is initially null', async () => {
  //     const kleur = 'grys';

  //     const updatedResultObject = {
  //       ...resultObject,
  //       styling: { colour: kleur },
  //     };

  //     const stylingObject = createModuleStyling({ styling: { colour: kleur } });

  //     mockSequentialResults(mockDb.select, [
  //       [{ ...resultObject, CourseID: courseId }],
  //       [],
  //       [],
  //     ]);
  //     mockSequentialResults(mockDb.update, [[updatedResultObject]]);
  //     mockSequentialResults(mockDb.insert, [[stylingObject]]);

  //     const result = await service.update(userId, existing.moduleID, {
  //       styling: { colour: kleur },
  //     });

  //     expect(result).toMatchObject({
  //       ...resultObject,
  //       styling: { colour: kleur },
  //     });
  //     expect(setStylingSpy).toHaveBeenCalled();
  //   });

  //   //Update styling - update styling entity
  //   it('should update only styling for a module - styling already defined', async () => {
  //     //Arrange
  //     const kleur = 'grys';

  //     const existingStylingObject = createModuleStyling({
  //       ModuleID: existing.moduleID,
  //       UserID: userId,
  //       styling: { colour: 'oldColour' },
  //     });

  //     const updatedStylingObject = {
  //       ...existingStylingObject,
  //       styling: { colour: kleur },
  //     };

  //     mockSequentialResults(
  //       mockDb.select,
  //       [
  //         [{ ...existing, CourseID: courseId }], //module exists
  //         [existingStylingObject],
  //       ], //styling entity exists
  //     );
  //     mockSequentialResults(mockDb.update, [[updatedStylingObject]]);

  //     //Act
  //     const result = await service.update(userId, existing.moduleID, {
  //       styling: { colour: kleur },
  //     });

  //     //Assert
  //     expect(result).toMatchObject({ ...existing, styling: { colour: kleur } });
  //     expect(setStylingSpy).toHaveBeenCalled();
  //   });
  // });//END_Test_updateModule
  // //END_Update

  // //Delete
  // describe('Test_deleteModule', () => {
  //   it('should delete module that exists', async () => {
  //     //Arrange
  //     mockSelectResult(mockDb, [existing]);
  //     mockDeleteResult(mockDb);

  //     //Act
  //     const result = await service.deleteById(existing.moduleID);

  //     //Assert
  //     expect(result).toMatchObject({
  //       moduleCode: existing.moduleCode,
  //       success: true,
  //     });
  //   });
  // });//END_Test_deleteModule
});
