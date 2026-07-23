import { Module } from '@nestjs/common';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { CourseModule } from '../Course/course.module';
import { GroupingModule } from '../Grouping/grouping.module';

@Module({
  imports: [CourseModule, GroupingModule],
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
