import { Module } from '@nestjs/common';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { UniversityService } from 'src/University/university.service';
import { CourseService } from 'src/Course/course.service';
import { CourseModule } from 'src/Course/course.module';

@Module({
  imports: [CourseModule],
  controllers: [ModuleController],
  providers: [ModuleService, UniversityService, CourseService],
  exports: [ModuleService],
})
export class ModuleModule {}
