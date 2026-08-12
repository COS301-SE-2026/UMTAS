import { CourseListResponseDto } from 'src/Course/dto/course.dto';
import { EventListResponseDto } from 'src/Events/dto/EventDto.dto';
import { ModuleListResponseDto } from 'src/Module/dto/module.dto';

export interface University_Adapter {
  authenticate(): Promise<void>;

  getCourses(): Promise<CourseListResponseDto>;

  getModules(): Promise<ModuleListResponseDto>;

  getEvents(): Promise<EventListResponseDto>;

  request<T = any>(url: string): Promise<T>;
}
