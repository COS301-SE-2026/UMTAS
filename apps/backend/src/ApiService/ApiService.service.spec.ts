import { ApiService } from './ApiService.service';

import { Test } from '@nestjs/testing';

//Constants
import { courseId, moduleId, uniId, userId } from 'src/Testing/constants';

//MockServices
import { createMockAdapterRegistryService } from 'src/Testing/Mocks/services/adapterRegistry.mock';
import { createMockUniversityService } from 'src/Testing/Mocks/services';
import { createMockCourseServiceV2 } from 'src/Testing/Mocks/services/course.mock';
import { createMockModuleServiceV2 } from 'src/Testing/Mocks/services/module.mock';
import { createMockEventServiceV2 } from 'src/Testing/Mocks/services/event.mock';

//Factories
import {
  createCourse,
  createUniversity,
  createModuleSingleResponseDto,
  createModule,
  createEventDto,
} from 'src/Testing/Factories';
import { UniversityService } from 'src/University/university.service';
import { CourseServiceV2 } from 'src/Course/courseV2.service';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import { EventServiceV2 } from 'src/Events/eventV2.service';
import { AdapterRegistry } from './Registry/AdapterRegistry.service';
import { ML_Adapter } from './Adapter/Maryland/ML_Adapter';
import {
  CourseListResponseDto,
  CourseSingleResponseDto,
  CreateCourseDto,
} from 'src/Course/dto/course.dto';
import {
  CreateModuleDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
} from 'src/Module/dto/module.dto';
import { BadRequestException } from '@nestjs/common';

const mlUni = createUniversity({
  UniversityID: uniId,
  ApiIdentifier: 'ML',
  BaseApiUrl: 'baseUrl',
});

const mockMLAdapter = {
  uniID: mlUni.UniversityID,
  uni: mlUni,
  baseUrl: mlUni.BaseApiUrl,
  apiKey: mlUni.ApiKey,

  authenticate: jest.fn().mockResolvedValue(undefined),
  getCourses: jest.fn().mockResolvedValue([
    {
      UniversityID: mlUni.UniversityID,
      CourseName: 'Computer Science 101',
      ExternalID: 'CS1',
    },
    {
      UniversityID: mlUni.UniversityID,
      CourseName: 'Mathematics 101',
      ExternalID: 'MATH1',
    },
  ]),
  getModules: jest.fn().mockResolvedValue([]),
  getEvents: jest.fn().mockResolvedValue([]),
  request: jest.fn(),
} as Partial<ML_Adapter> as ML_Adapter;

describe('ApiService', () => {
  let service: ApiService;

  const { mockAdapterRegistryService, reset: resetAdapterRegistry } =
    createMockAdapterRegistryService();
  const { mockUniversityService, reset: resetUni } =
    createMockUniversityService();
  const { mockCourseServiceV2, reset: resetCourse } =
    createMockCourseServiceV2();
  const { mockModuleServiceV2, reset: resetModule } =
    createMockModuleServiceV2();
  const { mockEventServiceV2, reset: resetEvent } = createMockEventServiceV2();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ApiService,
        { provide: AdapterRegistry, useValue: mockAdapterRegistryService },
        { provide: UniversityService, useValue: mockUniversityService },
        { provide: CourseServiceV2, useValue: mockCourseServiceV2 },
        { provide: ModuleServiceV2, useValue: mockModuleServiceV2 },
        { provide: EventServiceV2, useValue: mockEventServiceV2 },
      ],
    }).compile();

    service = module.get(ApiService);

    mockAdapterRegistryService.getAdapter?.mockReturnValue(mockMLAdapter);
  }); //END_beforeEach

  //after each
  afterEach(() => {
    resetAdapterRegistry();
    resetUni();
    resetCourse();
    resetModule();
    resetEvent();

    jest.clearAllMocks();
  });

  //Tests

  describe('Test_getCourse', () => {
    //Happy - creates and returns courses
    it('should return a list of courses - freshly created', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      mockCourseServiceV2.getByExternalID?.mockResolvedValue(null);

      const course1 = createCourse();
      const course2 = createCourse();

      mockCourseServiceV2.create?.mockResolvedValueOnce(course1);
      mockCourseServiceV2.create?.mockResolvedValueOnce(course2);

      const expectedResult: CourseListResponseDto = {
        courses: [course1, course2],
        message: 'Number of courses returned = [2]',
      };

      // Act
      const result = await service.getCourses(mlUni.UniversityID, 1, 2);

      // Assert
      expect(getUniSpy).toHaveBeenCalledWith(mlUni.UniversityID);
      expect(result).toMatchObject(expectedResult);
    });

    //Happy - updates and returns courses
    it('should return a list of courses - updated', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      const oldCourse1 = createCourse({ CourseName: 'old1' });
      const oldCourse2 = createCourse({ CourseName: 'old2' });

      mockCourseServiceV2.getByExternalID
        ?.mockResolvedValueOnce(oldCourse1)
        .mockResolvedValueOnce(oldCourse2);

      const course1 = createCourse();
      const course2 = createCourse();

      mockCourseServiceV2.update?.mockResolvedValueOnce(course1);
      mockCourseServiceV2.update?.mockResolvedValueOnce(course2);

      const expectedResult: CourseListResponseDto = {
        courses: [course1, course2],
        message: 'Number of courses returned = [2]',
      };

      // Act
      const result = await service.getCourses(mlUni.UniversityID, 1, 2);

      // Assert
      expect(getUniSpy).toHaveBeenCalledWith(mlUni.UniversityID);
      expect(mockCourseServiceV2.update).toHaveBeenCalledTimes(2);

      expect(result).toMatchObject(expectedResult);
    });

    //Happy - fetch and returns courses
    it('should return a list of existing courses', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      const course1 = createCourse({ ExternalID: '1' });
      const course2 = createCourse({ ExternalID: '2' });

      mockCourseServiceV2.getByExternalID
        ?.mockResolvedValueOnce(course1)
        .mockResolvedValueOnce(course2);

      const mockCoursesFromAdapter: Partial<CreateCourseDto>[] = [
        {
          CourseName: course1.CourseName,
          ExternalID: course1.ExternalID,
        },
        {
          CourseName: course2.CourseName,
          ExternalID: course2.ExternalID,
        },
      ];

      mockMLAdapter.getCourses = jest
        .fn()
        .mockResolvedValue(mockCoursesFromAdapter);

      const expectedResult: CourseListResponseDto = {
        courses: [course1, course2],
        message: 'Number of courses returned = [2]',
      };

      // Act
      const result = await service.getCourses(mlUni.UniversityID, 1, 2);

      // Assert
      expect(getUniSpy).toHaveBeenCalledWith(mlUni.UniversityID);
      expect(mockCourseServiceV2.update).not.toHaveBeenCalled();
      expect(mockCourseServiceV2.create).not.toHaveBeenCalled();

      expect(result).toMatchObject(expectedResult);
    });
  }); //END_Test_getCourse

  describe('Test_getModules', () => {
    //UnHappy - throw Badrequest from getCOurse
    it('should throw if courseId is invalid', async () => {
      //Act + Assert
      await expect(service.getModules(userId, uniId, '   ')).rejects.toThrow(
        new BadRequestException('Invalid courseID'),
      );
    });

    //Happy - Create + return modules
    it('should return a list of modules - created freshly', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      const course = createCourse({
        CourseID: courseId,
        CourseName: 'someCourse',
      });

      const getCourseSpy = jest
        .spyOn(service['courseService'], 'getById')
        .mockResolvedValue(course);

      mockModuleServiceV2.getByExternalID?.mockResolvedValue(null);

      const module1 = createModule();
      const module2 = createModule();

      const mockModulesFromAdapter = [
        {
          UniversityID: uniId,
          CourseID: courseId,
          ExternalID: 'MOD1',
        },
        {
          UniversityID: uniId,
          CourseID: courseId,
          ExternalID: 'MOD2',
        },
      ];

      mockMLAdapter.getModules = jest
        .fn()
        .mockResolvedValue(mockModulesFromAdapter);

      // Mock the moduleService.create to return the created modules
      const moduleServiceSpy = jest
        .spyOn(service['moduleService'], 'create')
        .mockResolvedValueOnce(module1)
        .mockResolvedValueOnce(module2);

      const modules: ModuleSingleResponseDto[] = [
        createModuleSingleResponseDto(module1),
        createModuleSingleResponseDto(module2),
      ];

      const expectedResult: ModuleListResponseDto = {
        modules,
        message: `Modules returned for course[${course.CourseName}] = [${modules.length}]`,
      };

      // Act
      const result = await service.getModules(userId, uniId, courseId);

      // Assert
      expect(getUniSpy).toHaveBeenCalled();
      expect(getCourseSpy).toHaveBeenCalled();
      expect(mockMLAdapter.getModules).toHaveBeenCalled();
      expect(moduleServiceSpy).toHaveBeenCalledTimes(2);

      expect(result).toMatchObject(expectedResult);
    });

    //Happy - Update + return modules
    it('should return a list of modules - created freshly', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      const course = createCourse({
        CourseID: courseId,
        CourseName: 'someCourse',
      });

      const getCourseSpy = jest
        .spyOn(service['courseService'], 'getById')
        .mockResolvedValue(course);

      const oldModule1 = createModule();
      const oldModule2 = createModule();

      mockModuleServiceV2.getByExternalID
        ?.mockResolvedValueOnce(oldModule1)
        .mockResolvedValueOnce(oldModule2);

      const module1 = createModule();
      const module2 = createModule();

      const mockModulesFromAdapter = [
        {
          UniversityID: uniId,
          CourseID: courseId,
          ExternalID: 'MOD1',
        },
        {
          UniversityID: uniId,
          CourseID: courseId,
          ExternalID: 'MOD2',
        },
      ];

      mockMLAdapter.getModules = jest
        .fn()
        .mockResolvedValue(mockModulesFromAdapter);

      // Mock the moduleService.create to return the created modules
      const moduleServiceSpy = jest
        .spyOn(service['moduleService'], 'update')
        .mockResolvedValueOnce(module1)
        .mockResolvedValueOnce(module2);

      const modules: ModuleSingleResponseDto[] = [
        createModuleSingleResponseDto(module1),
        createModuleSingleResponseDto(module2),
      ];

      const expectedResult: ModuleListResponseDto = {
        modules,
        message: `Modules returned for course[${course.CourseName}] = [${modules.length}]`,
      };

      // Act
      const result = await service.getModules(userId, uniId, courseId);

      // Assert
      expect(getUniSpy).toHaveBeenCalled();
      expect(getCourseSpy).toHaveBeenCalled();
      expect(mockMLAdapter.getModules).toHaveBeenCalled();
      expect(moduleServiceSpy).toHaveBeenCalledTimes(2);

      expect(result).toMatchObject(expectedResult);
    });

    //Happy - Fetch + return modules
    it('should return existing modules when nothing has changed', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      const course = createCourse({
        CourseID: courseId,
        CourseName: 'someCourse',
      });

      const getCourseSpy = jest
        .spyOn(service['courseService'], 'getById')
        .mockResolvedValue(course);

      const existingModule1 = createModule({
        ExternalID: '1',
      });

      const existingModule2 = createModule({
        ExternalID: '2',
      });

      mockModuleServiceV2.getByExternalID
        ?.mockResolvedValueOnce(existingModule1)
        .mockResolvedValueOnce(existingModule2);

      const mockModulesFromAdapter: Partial<CreateModuleDto>[] = [
        {
          moduleName: existingModule1.moduleName,
          ExternalID: existingModule1.ExternalID,
        },
        {
          moduleName: existingModule1.moduleName,
          ExternalID: existingModule2.ExternalID,
        },
      ];

      mockMLAdapter.getModules = jest
        .fn()
        .mockResolvedValue(mockModulesFromAdapter);

      // Act
      const result = await service.getModules(userId, uniId, courseId);

      // Assert
      expect(getUniSpy).toHaveBeenCalledWith(uniId);
      expect(getCourseSpy).toHaveBeenCalledWith(courseId);
      expect(mockMLAdapter.getModules).toHaveBeenCalledWith(course);

      expect(mockModuleServiceV2.getByExternalID).toHaveBeenCalledTimes(2);

      // Nothing should be created or updated
      expect(mockModuleServiceV2.create).not.toHaveBeenCalled();
      expect(mockModuleServiceV2.update).not.toHaveBeenCalled();

      // Existing modules should be returned
      expect(result.modules).toEqual([existingModule1, existingModule2]);

      expect(result.message).toBe(
        `Modules returned for course[${course.CourseName}] = [2]`,
      );
    });
  });

  describe('Test_getEvents', () => {
    it('should throw if moduleID invalid', async () => {
      //Act + Assert
      await expect(service.getEvents(userId, uniId, '   ')).rejects.toThrow(
        new BadRequestException('Invalid moduleID'),
      );
    });

    it('should return a list of events', async () => {
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(mlUni);

      const module = createModule({
        moduleID: moduleId,
        moduleName: 'someModule',
      });

      const getModuleSpy = jest
        .spyOn(service['moduleService'], 'getById')
        .mockResolvedValue(module);

      const mockEventsFromAdapter = [
        {
          UniversityID: uniId,
          ModuleID: moduleId,
          EventName: 'Event 1',
          ActivityCode: 'ACT1',
          EventCriteria: { key: 'value1' },
          ExternalID: 'EXT1',
        },
        {
          UniversityID: uniId,
          ModuleID: moduleId,
          EventName: 'Event 2',
          ActivityCode: 'ACT2',
          EventCriteria: { key: 'value2' },
          ExternalID: 'EXT2',
        },
      ];

      mockMLAdapter.getEvents = jest
        .fn()
        .mockResolvedValue(mockEventsFromAdapter);

      const event1 = createEventDto(
        {
          eventId: 'event-1',
          eventName: 'Event 1',
          activityCode: 'ACT1',
        },
        {},
      );

      const event2 = createEventDto(
        {
          eventId: 'event-2',
          eventName: 'Event 2',
          activityCode: 'ACT2',
        },
        {},
      );

      const eventServiceSpy = jest
        .spyOn(service['eventService'], 'createV2')
        .mockResolvedValueOnce({ event: event1 })
        .mockResolvedValueOnce({ event: event2 });

      const result = await service.getEvents(userId, uniId, moduleId);

      expect(getUniSpy).toHaveBeenCalled();
      expect(getModuleSpy).toHaveBeenCalled();
      expect(mockMLAdapter.getEvents).toHaveBeenCalled();
      expect(eventServiceSpy).toHaveBeenCalledTimes(2);
      expect(result.events).toHaveLength(2);
      expect(result.message).toBe(
        'Events returned for Module[someModule] = [2]',
      );
    });
  });

  describe('Test_getCourseWithModulesAndEvents', () => {
    it('should return a course with modules and events', async () => {
      //Arrange
      const course = createCourse({
        CourseID: courseId,
        CourseName: 'someCourse',
      });

      const getCourseSpy = jest
        .spyOn(service['courseService'], 'getById')
        .mockResolvedValue(course);

      const module1 = createModule({
        moduleID: 'module-1',
        moduleName: 'Module 1',
      });
      const module2 = createModule({
        moduleID: 'module-2',
        moduleName: 'Module 2',
      });

      const modules: ModuleSingleResponseDto[] = [
        {
          moduleID: module1.moduleID,
          moduleCode: module1.moduleCode,
          moduleName: module1.moduleName,
          moduleDescription: module1.moduleDescription,
          ExternalID: module1.ExternalID,
          validated: module1.validated,
          Events: [],
        },
        {
          moduleID: module2.moduleID,
          moduleCode: module2.moduleCode,
          moduleName: module2.moduleName,
          moduleDescription: module2.moduleDescription,
          ExternalID: module2.ExternalID,
          validated: module2.validated,
          Events: [],
        },
      ];

      const getModulesSpy = jest
        .spyOn(service, 'getModules')
        .mockResolvedValue({
          modules,
        });

      const getEventsSpy = jest.spyOn(service, 'getEvents').mockResolvedValue({
        events: [],
      });

      const expectedResult: CourseSingleResponseDto = {
        ...course,
        Modules: modules,
      };

      //Act
      const result = await service.getCourseWithModulesAndEvents(
        userId,
        uniId,
        courseId,
      );

      //Assert
      expect(getCourseSpy).toHaveBeenCalled();
      expect(getModulesSpy).toHaveBeenCalled();
      expect(getEventsSpy).toHaveBeenCalledTimes(2);

      expect(result).toMatchObject(expectedResult);
    });
  });
});
