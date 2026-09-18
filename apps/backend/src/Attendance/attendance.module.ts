import { Module } from '@nestjs/common';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceSessionService } from './attendance-session.service';
import { NfcAttendanceService } from './nfc-attendance.service';
import { AttendanceCaptureService } from './attendance-capture.service';

import { EventModule } from '../Events/event.module';

@Module({
  imports: [EventModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceSessionService,
    AttendanceCaptureService,
    NfcAttendanceService,
  ],
  exports: [
    AttendanceService,
    AttendanceSessionService,
    AttendanceCaptureService,
    NfcAttendanceService,
  ],
})
export class AttendanceModule {}
