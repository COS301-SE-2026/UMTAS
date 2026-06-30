import { Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { UniversityService } from 'src/University/university.service';

@Module({
  controllers: [CourseController],
  providers: [CourseService, UniversityService],
  exports: [CourseService],
})
export class CourseModule {}
