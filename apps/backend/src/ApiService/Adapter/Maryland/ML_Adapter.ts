import { BadRequestException } from '@nestjs/common';
import { University_Adapter } from '../University_Adapter';
import { CourseDto, CreateCourseDto } from 'src/Course/dto/course.dto';
import { CreateModuleDto, ModulesDto } from 'src/Module/dto/module.dto';
import { CreateEventDtoV2 } from 'src/Events/dto/EventDto.dto';
import { DayOfWeek } from 'src/Events/dto/event.types';

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

  async getCourses(page: number, limit: number): Promise<CreateCourseDto[]> {
    const response: ExternalCourse[] = await this.request('courses', {
      page,
      per_page: limit,
    });

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
      per_page: 100,
    });

    const result: CreateModuleDto[] = response.map((module) => ({
      moduleCode: module.section_id.replace('-', '').substring(0, 14),
      moduleName: `${course.CourseName}-[${module.section_id}]`.substring(
        0,
        99,
      ),
      moduleDescription: `${course.CourseName} "default description"`,
      ExternalID: module.section_id,
      CourseID: course.CourseID,
      CourseModuleInfo: {
        SemesterOfStudy: module.semester,
        Core: true,
      },
    }));

    return result;
  }

  async getEvents(module: ModulesDto): Promise<CreateEventDtoV2[]> {
    const externalId = module.ExternalID ?? null;
    if (externalId === null) {
      throw new BadRequestException(
        `You are not referring to an existing external module with [${module.moduleID}]`,
      );
    }

    const response: ExternalModule[] = await this.request(
      `courses/sections/${externalId}`,
    );

    if (response.length === 0) return []; //kannie gooi nie :(

    const section = response[0];

    const result: CreateEventDtoV2[] = [];

    for (const meeting of section.meetings) {
      const days: DayOfWeek[] = this.parseDays(meeting.days);

      for (const day of days) {
        result.push({
          isRecurring: true,
          eventName: `Event_${module.moduleName.substring(0, 15)}`,
          eventCriteria: {
            moduleId: module.moduleID,
            dayOfWeek: day,
            startTime: this.convertTime(meeting.start_time),
            endTime: this.convertTime(meeting.end_time),
          },
          activityType: 'lecture',
          activityCode: 'lec',
        });
      } //END_day
    } //END_meeting

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

  private convertTime(time: string): string {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);

    if (!match) {
      throw new Error(`Invalid time format: ${time}`);
    }

    let hour = Number(match[1]);
    const minutes = match[2];
    const period = match[3].toLowerCase();

    if (period === 'am' && hour === 12) {
      hour = 0;
    } else if (period === 'pm' && hour !== 12) {
      hour += 12;
    }

    return `${String(hour).padStart(2, '0')}:${minutes}`;
  }
}
