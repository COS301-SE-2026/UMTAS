import { CourseServiceV2 } from 'src/Course/courseV2.service';
import { CourseService } from '../../../Course/course.service';

export function createMockCourseService() {
  const mockCourseService: Partial<jest.Mocked<CourseService>> = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),

    //helpertjies
    duplicateCourseNamePerUniversity: jest.fn(),
  };

  return {
    mockCourseService,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockCourseService

//V2
export function createMockCourseServiceV2() {
  const mockCourseServiceV2: Partial<jest.Mocked<CourseServiceV2>> = {
    ...createMockCourseService().mockCourseService,
    getAllV2: jest.fn(),
    getByIdV2: jest.fn(),
    getByExternalID: jest.fn(),
  };

  return {
    mockCourseServiceV2,
    reset: () => jest.clearAllMocks(),
  };
} //END_createMockCourseServiceV2
