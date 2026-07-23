import { Module, forwardRef } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { UniversityModule } from '../University/university.module';
import { GroupingModule } from '../Grouping/grouping.module';

@Module({
  imports: [UniversityModule, forwardRef(() => GroupingModule)],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
