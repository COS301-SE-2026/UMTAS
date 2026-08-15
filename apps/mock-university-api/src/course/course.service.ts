import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseService {
  getCourses() {
    return [
      {
        course_id: '456123456123456123',
        course_name: 'Computer Science',
        department: 'EBIT',
        description: 'Computer stuff.',
      },
      {
        course_id: '456123456789456123',
        course_name: 'Genetics',
        department: 'NAS',
        description: 'Must have something to do with AI.',
      },
    ];
  }
}
