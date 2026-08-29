import { Controller, Get } from '@nestjs/common';
import { CourseService } from './course.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Courses')
@Controller('api/courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  getCourses() {
    return this.courseService.getCourses();
  }
}
