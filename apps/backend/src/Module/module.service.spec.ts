import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

//Constants
import { userId, courseId } from '../Testing/constants.spec';

//Table imports
import { modules, CourseModule, ModuleStyling } from '../entities/index';

//Actual Service imports
import { ModuleService } from './module.service';
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockSequentialResults } from '../Testing/Mocks/database.helpers';
import { createModule, createCourseModule, createModuleStyling, baseDto } from '../Testing/Factories/module.factory';
import { createMockCourseService } from '../Testing/Factories/course.factory';


describe('ModuleService', () => {
  let service: ModuleService;

  const {mockDb, reset: resetDb} = createMockDatabase();
  const {mockCourseService, reset: resetCourse} = createMockCourseService();


  beforeEach(async ()=>{

    const module = await Test.createTestingModule({
      providers: [
        ModuleService,
        {provide: DatabaseService, useValue: {db: mockDb}},
        {provide: CourseService, useValue: mockCourseService}
      ]
    }).compile();

    service = module.get(ModuleService);
  });

  afterEach(()=>{
    resetDb();
    resetCourse();
  });

  //TESTS
  //Create
  describe('Test_CreateModule', ()=>{

    //Happy - no styling
    it('create module - no styling', async ()=>{

      mockSequentialResults(mockDb.select, [[]]);

      const newModule = createModule({
        moduleCode: baseDto.moduleCode,
        moduleName: baseDto.moduleName,
        moduleDescription: baseDto.moduleDescription
      });
      const newCourseModule = createCourseModule({
        ModuleID: newModule.moduleID,
        CourseID: courseId
      });

      mockSequentialResults(mockDb.insert, [
        [newModule], [newCourseModule]
      ]);

      const result = await service.create(userId, baseDto);

      expect(mockCourseService.getById).toHaveBeenCalledWith(courseId);
      expect(mockDb.insert).toHaveBeenCalledWith(modules);
      expect(mockDb.insert).toHaveBeenCalledWith(CourseModule);
      expect(result).toEqual(newModule);
    });

    //Happy - with styling
    it('create module - with styling', async ()=>{

      mockSequentialResults(mockDb.select, [[]]);

      const newModule = createModule();
      const newCourseModule = createCourseModule({
        ModuleID: newModule.moduleID,
        CourseID: courseId
      });
      const newStyling = createModuleStyling({
        ModuleID: newModule.moduleID,
        UserID: userId,
        styling: {colour:'#grys'}
      });

      mockSequentialResults(mockDb.insert, [
        [newModule], [newCourseModule], [newStyling]
      ]);

      const dto = {...baseDto, styling: {colour:'#grys'}};

      mockSequentialResults(mockDb.select, [[]]);//styling checks if styling exists

      const result = await service.create(userId, dto);

      expect(mockDb.insert).toHaveBeenCalledWith(ModuleStyling);
      expect(result).toEqual({...newModule, styling: newStyling.styling});
    });
  });


});
