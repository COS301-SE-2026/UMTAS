import { Injectable, NotImplementedException } from '@nestjs/common';
import {
  AcademicCalendarDto,
  CalendarRestrictionDto,
  CalendarRestrictionListDto,
  CreateAcademicCalendarDto,
  CreateCalendarRestrictionDto,
  DeleteAcademicCalendarResponseDto,
  DeleteCalendarRestrictionResponseDto,
  GenerateCalendarDto,
  GeneratedCalendarDto,
  UpdateAcademicCalendarDto,
  UpdateCalendarRestrictionDto,
} from './dto';

/**
 * Typed application boundary for the academic-calendar routes.
 * Persistence and generation behavior is implemented in the later service phases.
 */
@Injectable()
export class AcademicCalendarService {
  createCalendar(
    userId: string,
    dto: CreateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    void userId;
    void dto;
    return this.notImplemented();
  }

  getCalendar(userId: string, id: string): Promise<AcademicCalendarDto> {
    void userId;
    void id;
    return this.notImplemented();
  }

  updateCalendar(
    userId: string,
    id: string,
    dto: UpdateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    void userId;
    void id;
    void dto;
    return this.notImplemented();
  }

  deleteCalendar(
    userId: string,
    id: string,
  ): Promise<DeleteAcademicCalendarResponseDto> {
    void userId;
    void id;
    return this.notImplemented();
  }

  getRestrictions(
    userId: string,
    academicCalendarId: string,
  ): Promise<CalendarRestrictionListDto> {
    void userId;
    void academicCalendarId;
    return this.notImplemented();
  }

  createRestriction(
    userId: string,
    academicCalendarId: string,
    dto: CreateCalendarRestrictionDto,
  ): Promise<CalendarRestrictionDto> {
    void userId;
    void academicCalendarId;
    void dto;
    return this.notImplemented();
  }

  updateRestriction(
    userId: string,
    academicCalendarId: string,
    restrictionId: string,
    dto: UpdateCalendarRestrictionDto,
  ): Promise<CalendarRestrictionDto> {
    void userId;
    void academicCalendarId;
    void restrictionId;
    void dto;
    return this.notImplemented();
  }

  deleteRestriction(
    userId: string,
    academicCalendarId: string,
    restrictionId: string,
  ): Promise<DeleteCalendarRestrictionResponseDto> {
    void userId;
    void academicCalendarId;
    void restrictionId;
    return this.notImplemented();
  }

  generateCalendar(dto: GenerateCalendarDto): Promise<GeneratedCalendarDto> {
    void dto;
    return this.notImplemented();
  }

  getGeneratedCalendar(id: string): Promise<GeneratedCalendarDto> {
    void id;
    return this.notImplemented();
  }

  private notImplemented(): never {
    throw new NotImplementedException(
      'Academic calendar service implementation is not available yet',
    );
  }
}
