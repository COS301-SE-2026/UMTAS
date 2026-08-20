import { Test } from '@nestjs/testing';

//Constants
import { userId, courseId, uniId, groupId } from '../Testing/constants';

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
  createCourseModule,
  createModuleStyling,
} from '../Testing/Factories/';

//Mock Services
import {
  createMockCourseService,
  createMockGroupingService,
} from '../Testing/Mocks/services';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

//DTO's
import { AddModulesToCourseDto, UpdateModuleDto } from './dto/module.dto';

describe('ModuleService', () => {
  let service: ModuleService;

  const { mockDb, reset: resetDb } = createMockDatabase();
  const { mockCourseService, reset: resetCourse } = createMockCourseService();
  const { mockGroupingService, reset: resetGrouping } =
    createMockGroupingService();

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
  });

  afterEach(() => {
    resetDb();
    resetCourse();
    resetGrouping();
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
    // it(`should throw if module code already exists for that moduleGrouping`, async () => {
    //   //Arrange
    //   const group = createGroup();
    //   const course = createCourse({ GroupID: group.GroupID });
    //   // const module = createModule();
    //   const dto = createModuleDto({ CourseID: course.CourseID });

    //   mockCourseService.getById?.mockResolvedValue(course);

    //   mockGroupingService.getById?.mockResolvedValue(group);

    //   mockTransaction(mockDb, {
    //     select: [[{ moduleCode: dto.moduleCode }]], //existingModuleCodeFormoduleGrouping
    //   });

    //   //Act + Assert
    //   await expect(service.create(userId, dto)).rejects.toThrow(
    //     ConflictException,
    //   );
    //   expect(mockCourseService.getById).toHaveBeenCalled();
    //   expect(mockGroupingService.getById).toHaveBeenCalled();
    // });

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

  //getById
  describe('Test_getById', () => {
    //UnHappy - should throw if module not found
    it('should throw if module not found', async () => {
      //Arrange
      mockDbResult(mockDb.select, []);

      //Act + Assert
      await expect(service.getById(userId, 'someId')).rejects.toThrow(
        NotFoundException,
      );
    });

    //Happy - should return module successfully
    it('should return module by id', async () => {
      //Arrange
      const module = createModule();
      mockDbResult(mockDb.select, [module]);

      //Act
      const result = await service.getById(userId, module.moduleID);

      //Assert
      expect(result).toMatchObject(module);
    });
  }); //END_Test_getById

  // //Update
  describe('Test_updateModule', () => {
    //UnHappy - module doesnt exist
    it('should throw if module does not exist', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Assert
      await expect(
        service.update(userId, 'someId', { moduleCode: 'newCode' }),
      ).rejects.toThrow(NotFoundException);
    });

    //UnHappy - failed to update
    it('should throw if update failed', async () => {
      //Arrange
      const oldModule = createModule();
      const dto: UpdateModuleDto = {
        moduleCode: 'newCode',
        moduleName: 'newName',
        moduleDescription: 'newDescription',
        validated: true,
      };

      mockTransaction(mockDb, {
        select: [[oldModule]],
        update: [[]], //update fails
      });

      //Act + Assert
      await expect(service.update(userId, 'someid', dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    //Happy - nothing to update, return old module
    it('should return old module if nothing to update', async () => {
      //Arrange
      const module = createModule();
      const dto: UpdateModuleDto = {
        moduleCode: module.moduleCode,
        moduleName: module.moduleName,
        moduleDescription: module.moduleDescription,
        validated: module.validated,
      };

      mockTransaction(mockDb, {
        select: [[module]],
      });

      //Act
      const result = await service.update(userId, module.moduleID, dto);

      //Assert
      expect(result).toMatchObject(module);
    });

    //Happy - update all fields of a module
    it('should successfully update all fields of a module', async () => {
      //Arrange
      const oldModule = createModule();
      const dto: UpdateModuleDto = {
        moduleCode: 'newCode',
        moduleName: 'newName',
        moduleDescription: 'newDescription',
        validated: true,
      };
      const newModule = createModule(dto);

      mockTransaction(mockDb, {
        select: [[oldModule]],
        update: [[newModule]],
      });

      //Act
      const result = await service.update(userId, oldModule.moduleID, dto);

      //Assert
      expect(result).toMatchObject(newModule);
    });

    //Happy - update all courseModule fields for module for course
    it('should udpate courseModule metadata for module', async () => {
      //Arrange
      const module = createModule();
      const course = createCourse();
      const dto: UpdateModuleDto = {
        CourseID: course.CourseID,
        Core: true,
        SemesterOfStudy: 'semester 2',
        YearOfStudy: 3,
      };

      const groupModuleId = 'someID';

      const oldCourseModule = createCourseModule({
        GroupModuleID: groupModuleId,
        CourseID: course.CourseID,
      });
      const newCourseModule = createCourseModule(dto);
      mockTransaction(mockDb, {
        select: [
          [module], //getByid
          [{ GroupModuleID: groupModuleId }], //select.from(GroupModules)
          [oldCourseModule], //select.from(CourseModule)
        ],
        update: [
          [newCourseModule], //update(CourseModule)
        ],
      });

      //Act
      const result = await service.update(userId, module.moduleID, dto);

      //Assert
      expect(result).toMatchObject({
        ...module,
        CourseModuleInfo: { ...newCourseModule },
      });
    });

    //Happy - update the styling of the module
    it('should update just the styling of the module', async () => {
      //Arrange
      const module = createModule();
      const dto: UpdateModuleDto = {
        styling: { colour: '#NEW' },
      };

      const oldStyling = createModuleStyling({
        ModuleID: module.moduleID,
        UserID: userId,
      });
      const newStyling = createModuleStyling({
        ModuleID: module.moduleID,
        UserID: userId,
        styling: { colour: '#NEW' },
      });

      mockTransaction(mockDb, {
        select: [
          [module], //getById
          [oldStyling], //setStyling
        ],
        update: [
          [newStyling], //setStyling
        ],
      });

      //Act
      const result = await service.update(userId, module.moduleID, dto);

      //Assert
      expect(result).toMatchObject({
        ...module,
        styling: dto.styling,
      });
    });
  }); //END_Test_updateModule

  //Delete
  describe('Test_deleteModule', () => {
    //UnHappy - module not found
    it(`should return success as false if no module deleted`, async () => {
      //Arrange
      mockDbResult(mockDb.delete, []);

      //Act
      const result = await service.deleteById('someID');

      //Assert
      expect(result.success).toEqual(false);
    });

    //Happy - succesfully deleted a module
    it('should return module code and success if deleted', async () => {
      //Arrange
      const module = createModule();

      mockDbResult(mockDb.delete, [module]);

      //Act
      const result = await service.deleteById(module.moduleID);

      //Assert
      expect(result).toMatchObject({
        moduleCode: module.moduleCode,
        success: true,
      });
    });
  }); //END_Test_deleteModule

  //Enroll to module
  describe('Test_enrollToModule', () => {
    //UnHappy - module not found
    it('should throw if module not found', async () => {
      //Arrange
      mockTransaction(mockDb, {
        select: [[]], //getById
      });

      //Act + Assert
      await expect(service.enrollToModule(userId, 'someID')).rejects.toThrow(
        NotFoundException,
      );
    });

    //UnHappy - enrollment failed
    it('should throw if enrollment failed', async () => {
      //Arrange
      const module = createModule();
      mockTransaction(mockDb, {
        select: [
          [module], //getById
          [], //select.from(ModuleEnrollment)
        ],
        insert: [[]], //enrollment failed
      });

      //Act + Assert
      await expect(
        service.enrollToModule(userId, module.moduleID),
      ).rejects.toThrow(InternalServerErrorException);
    });

    //Happy - student already enrolled
    it('should return that user already enrolled', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [
          [module], //getById
          [{ ModuleID: module.moduleID, UserID: userId }],
        ],
      });

      //Act
      const result = await service.enrollToModule(userId, module.moduleID);

      //Assert
      expect(result.message).toEqual(
        `User[${userId}] already enrolled in module[${module.moduleID}]`,
      );
    });

    //happy - should enroll student to module
    it('should enroll user to module', async () => {
      //Arrange
      const module = createModule();

      mockTransaction(mockDb, {
        select: [
          [module], //getById
          [], //select.from(Moduleenrollment)
        ],
        insert: [[{ ModuleID: module.moduleID, UserID: userId }]],
      });

      //Act
      const result = await service.enrollToModule(userId, module.moduleID);

      //Assert
      expect(result).toMatchObject({
        moduleID: module.moduleID,
        UserID: userId,
        message: `Successfully enrolled student[${userId}] into module[${module.moduleID}]`,
      });
    });
  }); //END_Test_enrollToModule

  //Add modules to course
  describe('Test_addModulesToCourse', () => {
    //UnHappy - throw if course doesn't exist
    it('should throw if course does not exist', async () => {
      //Arrange
      mockCourseService.getById?.mockRejectedValue(new NotFoundException());
      const dto: AddModulesToCourseDto = {
        modules: ['someID'],
      };

      //Act + Assert
      await expect(service.addModulesToCourse('someID', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    //UnHappy - throw modules that dont exist
    it('should throw if certain modules dont exist', async () => {
      //Arrange
      const dto: AddModulesToCourseDto = {
        modules: ['someID'],
      };
      const course = createCourse();
      mockCourseService.getById?.mockResolvedValue(course);

      mockTransaction(mockDb, {
        select: [[]],
      });

      //Act + Assert
      await expect(
        service.addModulesToCourse(course.CourseID, dto),
      ).rejects.toThrow(BadRequestException);
    });

    //Happy - add modules to course
    it('should add modules to the courses group', async () => {
      const course = createCourse({ GroupID: groupId });
      const modules = [createModule(), createModule()];
      const dto: AddModulesToCourseDto = {
        modules: [modules[0].moduleID, modules[1].moduleID],
      };

      mockCourseService.getById?.mockResolvedValue(course);

      mockTransaction(mockDb, {
        select: [
          modules, //existingModules
          [], //partnerCourse
        ],
      });

      mockGroupingService.populateGroup?.mockResolvedValue({
        GroupID: groupId,
        Hash: 'someHash',
        modules: [modules[0].moduleID, modules[1].moduleID],
      });

      //Act
      const result = await service.addModulesToCourse(course.CourseID, dto);

      //Assert
      expect(result).toMatchObject({
        CourseID: course.CourseID,
        ...dto,
      });

      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockGroupingService.populateGroup).toHaveBeenCalled();
    });

    //Happy - add modules to course creating new group
    it('should add modules to new group since other course uses old group', async () => {
      const course = createCourse({ GroupID: groupId });
      const partnerCourse = createCourse({ GroupID: groupId });
      const modules = [createModule(), createModule()];
      const dto: AddModulesToCourseDto = {
        modules: [modules[0].moduleID, modules[1].moduleID],
      };

      mockCourseService.getById?.mockResolvedValue(course);

      mockTransaction(mockDb, {
        select: [
          modules, //existingModules
          [partnerCourse], //partnerCourse
        ],
      });

      mockGroupingService.getById?.mockResolvedValue({
        GroupID: groupId,
        Hash: 'someHash',
        modules: [],
      });

      const newGroup = createGroup();

      mockGroupingService.createModuleGrouping?.mockResolvedValue({
        GroupID: newGroup.GroupID,
        Hash: 'someHash',
        modules: dto.modules,
      });

      //Act
      const result = await service.addModulesToCourse(course.CourseID, dto);

      //Assert
      expect(result).toMatchObject({
        CourseID: course.CourseID,
        ...dto,
      });

      expect(mockCourseService.getById).toHaveBeenCalled();
      expect(mockGroupingService.getById).toHaveBeenCalled();
      expect(mockGroupingService.createModuleGrouping).toHaveBeenCalled();
    });
  }); //END_Test_addModulesToCourse
});
