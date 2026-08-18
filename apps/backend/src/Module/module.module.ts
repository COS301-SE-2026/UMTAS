import { Module } from '@nestjs/common';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { CourseModule } from '../Course/course.module';
import { GroupingModule } from '../Grouping/grouping.module';
import { ModuleServiceV2 } from './moduleV2.service';

@Module({
  imports: [CourseModule, GroupingModule],
  controllers: [ModuleController],
  providers: [ModuleService, ModuleServiceV2],
  exports: [ModuleService, ModuleServiceV2],
})
export class ModuleModule {}
