import { Module } from '@nestjs/common';
import { CourseModule } from '../Course/course.module';
import { GroupingService } from './grouping.service';

@Module({
  imports: [CourseModule],
  //   controllers: [ModuleController],
  providers: [GroupingService],
  exports: [GroupingService],
})
export class GroupingModule {}
