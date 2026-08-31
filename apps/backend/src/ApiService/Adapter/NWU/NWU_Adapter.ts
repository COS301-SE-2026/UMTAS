import { NotImplementedException } from '@nestjs/common';
import { University_Adapter } from '../University_Adapter';
import { CourseDto, CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateModuleDto, ModulesDto } from 'src/Module/dto/module.dto';
import { CreateEventDtoV2 } from 'src/Events/dto/EventDto.dto';

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

  async getModules(course: CourseDto): Promise<CreateModuleDto[]> {
    console.log(course);
    throw new NotImplementedException();
  }

  async getEvents(module: ModulesDto): Promise<CreateEventDtoV2[]> {
    console.log(module);
    throw new NotImplementedException();
  }

  // 🎅's little helpers
}
