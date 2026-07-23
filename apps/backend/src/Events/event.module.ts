import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventImportFingerprintService } from './event-import-fingerprint.service';

import { ModuleModule } from 'src/Module/module.module';
import { CourseModule } from 'src/Course/course.module';

@Module({
  imports: [ModuleModule, CourseModule],
  controllers: [EventController],
  providers: [EventService, EventImportFingerprintService],
  exports: [EventService, EventImportFingerprintService],
})
export class EventModule {}
