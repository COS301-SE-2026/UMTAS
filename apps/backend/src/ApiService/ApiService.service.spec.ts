import { ApiService } from './ApiService.service';

import { Test } from '@nestjs/testing';

//Constants
import { uniId } from 'src/Testing/constants';

//MockServices
import { createMockAdapterRegistryService } from 'src/Testing/Mocks/services/adapterRegistry.mock';
import { createMockUniversityService } from 'src/Testing/Mocks/services';
import { createMockCourseServiceV2 } from 'src/Testing/Mocks/services/course.mock';
import { createMockModuleServiceV2 } from 'src/Testing/Mocks/services/module.mock';
import { createMockEventServiceV2 } from 'src/Testing/Mocks/services/event.mock';

//Factories
import { createUniversity } from 'src/Testing/Factories';
import { UniversityService } from 'src/University/university.service';
import { CourseServiceV2 } from 'src/Course/courseV2.service';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import { EventServiceV2 } from 'src/Events/eventV2.service';
import { AdapterRegistry } from './Registry/AdapterRegistry.service';
import { NWU_Adapter } from './Adapter/NWU/NWU_Adapter';

const nwuUni = createUniversity({
  UniversityID: uniId,
  ApiIdentifier: 'NWU',
  BaseApiUrl: 'baseUrl',
});

const mockNWUAdapter = {
  uniID: nwuUni.UniversityID,
  uni: nwuUni,
  baseUrl: nwuUni.BaseApiUrl,
  apiKey: nwuUni.ApiKey,

  authenticate: jest.fn().mockResolvedValue(undefined),
  getCourses: jest.fn().mockResolvedValue([
    {
      UniversityID: nwuUni.UniversityID,
      CourseName: 'Computer Science 101',
      ExternalID: 'CS1',
    },
    {
      UniversityID: nwuUni.UniversityID,
      CourseName: 'Mathematics 101',
      ExternalID: 'MATH1',
    },
  ]),
  getModules: jest.fn().mockResolvedValue([]),
  getEvents: jest.fn().mockResolvedValue([]),
  request: jest.fn(),
} as Partial<NWU_Adapter> as NWU_Adapter;

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

    mockAdapterRegistryService.getAdapter?.mockReturnValue(mockNWUAdapter);
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
    //Happy - returns a course
    it('should return a list of courses', async () => {
      // Arrange
      const getUniSpy = jest
        .spyOn(service['uniService'], 'getById')
        .mockResolvedValue(nwuUni);

      // Act
      const result = await service.getCourses(nwuUni.UniversityID, 1, 2);

      // Assert
      expect(getUniSpy).toHaveBeenCalledWith(nwuUni.UniversityID);
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
    });
  }); //END_Test_getCourse
});
