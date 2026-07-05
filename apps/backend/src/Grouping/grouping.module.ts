import { Module, forwardRef } from '@nestjs/common';
import { CourseModule } from '../Course/course.module';
import { GroupingService } from './grouping.service';

@Module({
  imports: [forwardRef(() => CourseModule)],
  //   controllers: [ModuleController],
  providers: [GroupingService],
  exports: [GroupingService],
})
export class GroupingModule {}
