import { NotImplementedException } from '@nestjs/common';
import { University_Adapter } from '../University_Adapter';
import { CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateModuleDto } from 'src/Module/dto/module.dto';
import { CreateEventDto } from 'src/Events/dto/EventDto.dto';

interface ExternalCourse {
  course_id: string;
  course_name: string;
  department: string;
  description: string;
}

export class NWU_Adapter extends University_Adapter {
  constructor(uni) {
    super(uni);
  }

  async authenticate(): Promise<void> {}

  async getCourses(): Promise<CreateCourseDto[]> {
    const response: ExternalCourse[] = await this.request('api/courses');

    const result: CreateCourseDto[] = response.map((course) => ({
      UniversityID: this.uniID,
      CourseName: course.course_name,
      ExternalID: course.course_id,
    }));
    // return courses;

    return result;
  }

  async getModules(): Promise<CreateModuleDto[]> {
    throw new NotImplementedException();
  }

  async getEvents(): Promise<CreateEventDto[]> {
    throw new NotImplementedException();
  }

  // 🎅's little helpers
}
