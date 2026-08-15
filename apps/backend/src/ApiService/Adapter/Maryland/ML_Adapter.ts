import { BadRequestException } from '@nestjs/common';
import { University_Adapter } from '../University_Adapter';
import { CourseDto, CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateModuleDto, ModulesDto } from 'src/Module/dto/module.dto';
import { CreateEventDto } from 'src/Events/dto/EventDto.dto';
import { DayOfWeek, EventSource } from 'src/Events/dto/event.types';

interface ExternalCourse {
  course_id: string; //External id
  name: string; //name of course
}

interface Meeting {
  days: string;
  room: string;
  building: string;
  start_time: string;
  end_time: string;
}

interface ExternalModule {
  course: string; //External Course ID  - Foreign key
  section_id: string; //Will be used as module name and code (split on -)
  semester: string;
  meetings: Meeting[];
}

const DAY_TOKENS: Record<string, DayOfWeek> = {
  M: 'monday',
  Tu: 'tuesday',
  W: 'wednesday',
  Th: 'thursday',
  F: 'friday',
};

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
      moduleName: `${course.CourseName}-[${module.section_id}]`,
      moduleDescription: `${course.CourseName} "default description"`,
      ExternalID: module.section_id,
      CourseID: course.CourseID,
      CourseModuleInfo: {
        SemesterOfStudy: module.semester,
        Core: true,
      },
    }));

    console.log(`Here CreateModuleDto[]: [${JSON.stringify(result)}]`);

    return result;
  }

  async getEvents(module: ModulesDto): Promise<CreateEventDto[]> {
    const externalId = module.ExternalID ?? null;
    if (externalId === null) {
      throw new BadRequestException(
        `You are not referring to an existing external course with [${module.moduleID}]`,
      );
    }

    const response: ExternalModule[] = await this.request(
      `courses/sections/${externalId}`,
    );

    const result: CreateEventDto[] = [];

    for (const event of response) {
      for (const meeting of event.meetings) {
        const days: DayOfWeek[] = this.parseDays(meeting.days);

        for (const day of days) {
          result.push({
            isRecurring: true,
            eventName: `Event_${module.moduleName}`,
            eventCriteria: {
              eventSource: EventSource.UNIVERSITY,
              moduleId: module.moduleID,
              dayOfWeek: day,
              startTime: meeting.start_time,
              endTime: meeting.end_time,
            },
            activityType: 'lecture',
            activityCode: 'lec',
          });
        } //END_day
      } //END_meeting
    } //END_event

    // console.log(`Here: [${JSON.stringify(result)}]`);

    return result;
  }

  // 🎅's little helpers
  private parseDays(days: string): DayOfWeek[] {
    const result: DayOfWeek[] = [];
    let remain = days;

    while (remain.length > 0) {
      const token = Object.keys(DAY_TOKENS).find((day) =>
        remain.startsWith(day),
      );

      if (!token)
        throw new BadRequestException(
          `No matching day for remaining days: [${remain}]`,
        );

      result.push(DAY_TOKENS[token]);
      remain = remain.slice(token.length);
    } //END_remain

    return result;
  }
}
