import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { UniversityService } from 'src/University/university.service';
import { CourseService } from 'src/Course/course.service';
import { ModuleService } from 'src/Module/module.service';

@Module({
  controllers: [BuilderController],
  providers: [BuilderService, UniversityService, CourseService, ModuleService],
  exports: [BuilderService],
})
export class BuilderModule {}
