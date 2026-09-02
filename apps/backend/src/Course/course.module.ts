import { Module, forwardRef } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { UniversityModule } from '../University/university.module';
import { GroupingModule } from '../Grouping/grouping.module';
import { ModuleModule } from 'src/Module/module.module';
import { CourseServiceV2 } from './courseV2.service';

@Module({
  imports: [
    UniversityModule,
    forwardRef(() => GroupingModule),
    forwardRef(() => ModuleModule),
  ],
  controllers: [CourseController],
  providers: [CourseService, CourseServiceV2],
  exports: [CourseService, CourseServiceV2],
})
export class CourseModule {}
