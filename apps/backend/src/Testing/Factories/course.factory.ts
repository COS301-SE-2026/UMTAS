import { randomUUID } from 'crypto';
import { Course } from 'src/entities';
import { CourseService } from 'src/Course/course.service';

export function createMockCourseService() {
  const mockCourseService: Partial<jest.Mocked<CourseService>> = {
    getById: jest.fn(),
  };

  return {
    mockCourseService,
    reset: () => {
      Object.values(mockCourseService).forEach((fn: any) => fn.mockReset());
    },
  };
} //END_createMockCourseService

type Course = typeof Course.$inferSelect;

export function createCourse(overrides: Partial<Course> = {}): Course {
  return {
    CourseID: randomUUID(),
    CourseName: 'BSc Computer Science',
    UniversityID: randomUUID(),

    ...overrides,
  };
} //END_createCourse
