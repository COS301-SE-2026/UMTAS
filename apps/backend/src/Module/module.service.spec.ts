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
import { mockDeleteResult, mockSelectResult, mockSequentialResults } from '../Testing/Mocks/database.helpers';
import { createModule, createCourseModule, createModuleStyling, baseDto } from '../Testing/Factories/module.factory';
import { createMockCourseService } from '../Testing/Factories/course.factory';


describe('ModuleService', () => {
  let service: ModuleService;

  const {mockDb, reset: resetDb} = createMockDatabase();
  const {mockCourseService, reset: resetCourse} = createMockCourseService();

  const existing = createModule();
  const resultObject = {...existing, styling: null};

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
  //END_Create

  //getAll
  describe('Test_GetAll', ()=>{

    it('return all modules for a courseId', async ()=>{

      mockSequentialResults(mockDb.selectDistinct, [[resultObject]]);

      const result = await service.getAll(userId, {courseId});

      expect(result).toEqual({modules: [resultObject]});
    });
  });
  //END_getAll

  //getById
  describe('Test_getById', ()=>{

    it('should return module by id', async ()=>{

      mockSequentialResults(mockDb.select, [[resultObject]]);

      const result = await service.getById(userId, existing.moduleID);

      expect(result).toEqual(resultObject);
    });
  });
  //END_getById

  //Update
  describe('Test_updateModule', ()=>{

    it('should update fields - no styling', async ()=>{

      const updatedModule = createModule({
        moduleName: 'NewModuleName',
        moduleCode: 'NewModuleCode',
        moduleDescription: 'newModuleDescription'
      });

      const updatedResultObject = {...resultObject, ...updatedModule};

      mockSequentialResults(mockDb.select, [[{...resultObject, CourseID: courseId}], []]);
      mockSequentialResults(mockDb.update, [[updatedResultObject]]);

      const result = await service.update(userId, existing.moduleID, updatedModule);

      expect(result).toMatchObject(updatedResultObject);
    });

    //Update only styling - create stylling entity
    it('should update only the styling for a module - styling is initially null', async ()=>{

      const kleur = 'grys';

      const updatedResultObject = {...resultObject, styling: {colour: kleur}};

      const stylingObject = createModuleStyling({styling: {colour: kleur}});

      mockSequentialResults(mockDb.select, [[{...resultObject, CourseID: courseId}], [], []]);
      mockSequentialResults(mockDb.update, [[updatedResultObject]]);
      mockSequentialResults(mockDb.insert, [[stylingObject]]);

      const result = await service.update(userId, existing.moduleID, {styling: {colour: kleur}});

      expect(result).toMatchObject({...resultObject, styling: {colour: kleur}});
    });

    //Update styling - update styling entity
    it('should update only styling for a module - styling already defined', async ()=>{

      //Arrange
      const kleur = 'grys';

      const existingStylingObject = createModuleStyling({
        ModuleID: existing.moduleID,
        UserID: userId,
        styling: {colour: 'oldColour'}
      });

      const updatedStylingObject = {...existingStylingObject, styling: {colour: kleur}};

      mockSequentialResults(mockDb.select, [
        [{...existing, CourseID: courseId}],//module exists
        [existingStylingObject]]//styling entity exists
      );
      mockSequentialResults(mockDb.update, [[updatedStylingObject]]);

      //Act
      const result = await service.update(userId, existing.moduleID, {styling: {colour: kleur}});

      //Assert
      expect(result).toMatchObject({...existing, styling: {colour: kleur}});
    });
  });
  //END_Update

  //Delete
  describe('Test_deleteModule', ()=>{

    it('should delete module that exists', async ()=>{

      //Arrange
      mockSelectResult(mockDb, [existing]);
      mockDeleteResult(mockDb);

      //Act
      const result = await service.deleteById(existing.moduleID);

      //Assert
      expect(result).toMatchObject({
        moduleCode: existing.moduleCode,
        success: true
      });
    });
  });
  //END_DELETE
});
