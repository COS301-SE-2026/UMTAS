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
