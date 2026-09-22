import { forwardRef, Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventImportFingerprintService } from './event-import-fingerprint.service';

import { ModuleModule } from 'src/Module/module.module';
import { CourseModule } from 'src/Course/course.module';
import { UniversityService } from 'src/University/university.service';
import { EventServiceV2 } from './eventV2.service';
import { RecurringEventService } from './recurring-event.service';

@Module({
  imports: [forwardRef(() => ModuleModule), CourseModule],
  controllers: [EventController],
  providers: [
    EventService,
    EventServiceV2,
    EventImportFingerprintService,
    UniversityService,
    RecurringEventService,
  ],
  exports: [
    EventService,
    EventServiceV2,
    EventImportFingerprintService,
    UniversityService,
    RecurringEventService,
  ],
})
export class EventModule {}
