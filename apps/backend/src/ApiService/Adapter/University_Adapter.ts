import { CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';

export abstract class University_Adapter {
  protected apiKey?: string;
  protected baseUrl?: string;

  contructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  abstract authenticate(): Promise<void>;

  abstract getCourses(): Promise<CourseListResponseDto>;

  abstract getModules(): Promise<ModuleListResponseDto>;

  abstract getEvents(): Promise<EventListResponseDto>;
}
