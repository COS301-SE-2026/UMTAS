import { Module } from '@nestjs/common';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceSessionService } from './attendance-session.service';

import { EventModule } from '../Events/event.module';

@Module({
  imports: [EventModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceSessionService],
  exports: [AttendanceService, AttendanceSessionService],
})
export class AttendanceModule {}
