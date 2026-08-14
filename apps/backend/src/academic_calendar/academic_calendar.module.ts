import { Module } from '@nestjs/common';
import { AcademicCalendarController } from './academic_calendar.controller';
import { AcademicCalendarService } from './academic_calendar.service';

@Module({
  controllers: [AcademicCalendarController],
  providers: [AcademicCalendarService],
  exports: [AcademicCalendarService],
})
export class AcademicCalendarModule {}
