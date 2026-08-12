import { Injectable } from '@nestjs/common';

@Injectable()
export class CourseService {
  getCourses() {
    return [
      {
        course_id: 'COS301',
        course_name: 'Software Engineering',
        department: 'Computer Science',
        description: 'Software engineering principles and practices.',
      },
      {
        course_id: 'COS326',
        course_name: 'Database Systems',
        department: 'Computer Science',
        description: 'Database design and implementation.',
      },
    ];
  }
}
