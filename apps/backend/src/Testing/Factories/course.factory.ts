import { randomUUID } from 'crypto';
import { Course } from '../../entities';
import { CreateCourseDto } from '../../Course/dto/course.dto';

const COURSE_NAME: string = 'BSc Computer Science';
const DEGREE: string = 'Bachelor of Science';

type Course = typeof Course.$inferSelect;

export function createCourse(overrides: Partial<Course> = {}): Course {
  return {
    CourseID: randomUUID(),
    UniversityID: randomUUID(),
    GroupID: null,
    CourseName: COURSE_NAME,
    Degree: DEGREE,
    ExternalID: null,

    ...overrides,
  };
} //END_createCourse

export function createCourseDto(
  overrides: Partial<CreateCourseDto> = {},
): CreateCourseDto {
  return {
    UniversityID: randomUUID(),
    GroupID: null,
    CourseName: COURSE_NAME,
    Degree: DEGREE,

    ...overrides,
  };
} //END_createCourseDto
