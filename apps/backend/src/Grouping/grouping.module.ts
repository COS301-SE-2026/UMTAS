import { Module, forwardRef } from '@nestjs/common';
import { CourseModule } from '../Course/course.module';
import { GroupingService } from './grouping.service';
import { GroupingController } from './grouping.controller';

@Module({
  imports: [forwardRef(() => CourseModule)],
  controllers: [GroupingController],
  providers: [GroupingService],
  exports: [GroupingService],
})
export class GroupingModule {}
