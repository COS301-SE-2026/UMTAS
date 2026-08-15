import { BadRequestException, NotImplementedException } from '@nestjs/common';
import { University_Adapter } from '../University_Adapter';
import { CourseDto, CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateModuleDto } from 'src/Module/dto/module.dto';
import { CreateEventDto } from 'src/Events/dto/EventDto.dto';

interface ExternalCourse {
  course_id: string; //External id
  name: string; //name of course
}

interface ExternalModule {
  course: string; //External Course ID  - Foreign key
  section_id: string; //Will be used as module name and code (split on -)
  semester: string;
}

export class ML_Adapter extends University_Adapter {
  constructor(uni) {
    super(uni);
  }

  async authenticate(): Promise<void> {}

  async getCourses(): Promise<CreateCourseDto[]> {
    const response: ExternalCourse[] = await this.request('courses');

    const result: CreateCourseDto[] = response.map((course) => ({
      UniversityID: this.uniID,
      CourseName: course.name.split(';')[0],
      ExternalID: course.course_id,
    }));

    return result;
  }

  async getModules(course: CourseDto): Promise<CreateModuleDto[]> {
    const externalId = course.ExternalID ?? null;
    if (externalId === null) {
      throw new BadRequestException(
        `You are not referring to an existing external course with [${course.CourseID}]`,
      );
    }

    const response: ExternalModule[] = await this.request(`courses/sections`, {
      course_id: externalId,
    });

    console.log(`Here: [${JSON.stringify(response)}]`);
    const result: CreateModuleDto[] = response.map((module) => ({
      moduleCode: module.section_id.split('-')[1],
      moduleName: module.section_id,
      ExternalID: module.section_id,
      CourseID: course.CourseID,
      CourseModuleInfo: {
        SemesterOfStudy: module.semester,
        Core: true,
      },
    }));

    console.log(`Here CreateModuleDto[]: [${JSON.stringify(result)}]`);

    return result;

    throw new NotImplementedException();
  }

  async getEvents(): Promise<CreateEventDto[]> {
    throw new NotImplementedException();
  }

  // 🎅's little helpers
}
