import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';

import { ModuleModule } from 'src/Module/module.module';
import { CourseModule } from 'src/Course/course.module';

@Module({
  imports: [ModuleModule, CourseModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
