import { Module } from '@nestjs/common';
import { AcademicCalendarController } from './academic_calendar.controller';
import { AcademicCalendarGenerationService } from './academic-calendar-generation.service';
import { AcademicCalendarService } from './academic_calendar.service';

@Module({
  controllers: [AcademicCalendarController],
  providers: [AcademicCalendarService, AcademicCalendarGenerationService],
  exports: [AcademicCalendarService],
})
export class AcademicCalendarModule {}
