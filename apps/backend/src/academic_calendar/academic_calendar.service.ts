import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import {
  AcademicCalendar,
  type AcademicCalendarRecord,
  CalendarRestriction,
  type CalendarRestrictionRecord,
  Event,
  EventsToTimetables,
  EventVenue,
  GeneratedCalendar,
  type GeneratedCalendarRecord,
  modules,
  ModuleStyling,
  Timetable,
  UniversityEvent,
  UserTimetable,
  Venue,
  type Weekday,
} from '../entities';
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
  UpdateCalendarRestrictionDto,
} from './dto';
import {
  AcademicCalendarGenerationService,
  type CalendarSourceEvent,
} from './academic-calendar-generation.service';

type DbError = { code?: string; constraint?: string };

const TIMEZONE = 'Africa/Johannesburg';

@Injectable()
export class AcademicCalendarService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly generationService: AcademicCalendarGenerationService,
  ) {}

  async createCalendar(
    universityId: string,
    dto: CreateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    try {
      const [created] = await this.databaseService.db
        .insert(AcademicCalendar)
        .values({ universityId, year: dto.year })
        .returning();

      if (!created) {
        throw new InternalServerErrorException(
          'Academic calendar was not created',
        );
      }
      return this.toCalendarDto(created);
    } catch (error) {
      if (this.isConstraint(error, '23505')) {
        this.throwCalendarAlreadyExists(universityId, dto.year);
      }
      throw error;
    }
  }

  async getCalendar(
    universityId: string,
    id: string,
  ): Promise<AcademicCalendarDto> {
    const calendar = await this.findCalendar(universityId, id);
    return this.toCalendarDto(calendar);
  }

  async deleteCalendar(
    universityId: string,
    id: string,
  ): Promise<DeleteAcademicCalendarResponseDto> {
    try {
      const [deleted] = await this.databaseService.db
        .delete(AcademicCalendar)
        .where(
          and(
            eq(AcademicCalendar.id, id),
            eq(AcademicCalendar.universityId, universityId),
          ),
        )
        .returning();

      if (!deleted) this.throwCalendarNotFound(id);
      return { success: true };
    } catch (error) {
      if (this.isConstraint(error, '23503')) {
        throw new ConflictException(
          'Generated snapshots still reference this calendar',
        );
      }
      throw error;
    }
  }

  async getRestrictions(
    universityId: string,
    academicCalendarId: string,
  ): Promise<CalendarRestrictionListDto> {
    await this.findCalendar(universityId, academicCalendarId);

    const restrictions = await this.databaseService.db
      .select()
      .from(CalendarRestriction)
      .where(eq(CalendarRestriction.academicCalendarId, academicCalendarId))
      .orderBy(
        asc(CalendarRestriction.startDate),
        asc(CalendarRestriction.createdAt),
      );

    return {
      restrictions: restrictions.map((row) => this.toRestrictionDto(row)),
    };
  }

  async createRestriction(
    universityId: string,
    academicCalendarId: string,
    dto: CreateCalendarRestrictionDto,
  ): Promise<CalendarRestrictionDto> {
    const calendar = await this.findCalendar(universityId, academicCalendarId);
    const values = this.normalizeRestriction(dto, calendar.year);

    try {
      const [created] = await this.databaseService.db
        .insert(CalendarRestriction)
        .values({ academicCalendarId, ...values })
        .returning();

      if (!created) {
        throw new InternalServerErrorException(
          'Calendar restriction was not created',
        );
      }
      return this.toRestrictionDto(created);
    } catch (error) {
      if (this.isConstraint(error, '23505')) {
        this.throwDuplicateDaySwap(academicCalendarId, values.startDate);
      }
      throw error;
    }
  }

  async updateRestriction(
    universityId: string,
    academicCalendarId: string,
    restrictionId: string,
    dto: UpdateCalendarRestrictionDto,
  ): Promise<CalendarRestrictionDto> {
    const calendar = await this.findCalendar(universityId, academicCalendarId);
    const values = this.normalizeRestriction(dto, calendar.year);

    try {
      const [updated] = await this.databaseService.db
        .update(CalendarRestriction)
        .set({ ...values, updatedAt: new Date() })
        .where(
          and(
            eq(CalendarRestriction.id, restrictionId),
            eq(CalendarRestriction.academicCalendarId, academicCalendarId),
          ),
        )
        .returning();

      if (!updated) this.throwRestrictionNotFound(restrictionId);
      return this.toRestrictionDto(updated);
    } catch (error) {
      if (this.isConstraint(error, '23505')) {
        this.throwDuplicateDaySwap(academicCalendarId, values.startDate);
      }
      throw error;
    }
  }

  async deleteRestriction(
    universityId: string,
    academicCalendarId: string,
    restrictionId: string,
  ): Promise<DeleteCalendarRestrictionResponseDto> {
    await this.findCalendar(universityId, academicCalendarId);

    const [deleted] = await this.databaseService.db
      .delete(CalendarRestriction)
      .where(
        and(
          eq(CalendarRestriction.id, restrictionId),
          eq(CalendarRestriction.academicCalendarId, academicCalendarId),
        ),
      )
      .returning();

    if (!deleted) this.throwRestrictionNotFound(restrictionId);
    return { success: true };
  }

  async generateCalendar(
    userId: string,
    universityId: string,
    dto: GenerateCalendarDto,
  ): Promise<GeneratedCalendarDto> {
    const calendar = await this.findCalendarForYear(
      universityId,
      this.currentYear(),
    );
    const timetable = await this.findOwnedTimetable(userId, dto.timetableId);
    const restrictions = await this.databaseService.db
      .select()
      .from(CalendarRestriction)
      .where(eq(CalendarRestriction.academicCalendarId, calendar.id))
      .orderBy(
        asc(CalendarRestriction.startDate),
        asc(CalendarRestriction.createdAt),
      );
    const sourceEvents = await this.findSourceEvents(
      userId,
      timetable.timetableID,
    );
    const payload = this.generationService.build(
      calendar,
      timetable.timetableName,
      restrictions,
      sourceEvents,
    );

    const [created] = await this.databaseService.db
      .insert(GeneratedCalendar)
      .values({
        academicCalendarId: calendar.id,
        timetableId: timetable.timetableID,
        payload,
      })
      .returning();

    if (!created) {
      throw new InternalServerErrorException(
        'Generated calendar snapshot was not saved',
      );
    }
    return this.toGeneratedCalendarDto(created);
  }

  async getGeneratedCalendar(
    userId: string,
    universityId: string,
    id: string,
  ): Promise<GeneratedCalendarDto> {
    const [row] = await this.databaseService.db
      .select({ generated: GeneratedCalendar })
      .from(GeneratedCalendar)
      .innerJoin(
        AcademicCalendar,
        eq(AcademicCalendar.id, GeneratedCalendar.academicCalendarId),
      )
      .innerJoin(
        UserTimetable,
        eq(UserTimetable.TimetableID, GeneratedCalendar.timetableId),
      )
      .where(
        and(
          eq(GeneratedCalendar.id, id),
          eq(AcademicCalendar.universityId, universityId),
          eq(UserTimetable.UserID, userId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Generated calendar not found for id: ${id}`);
    }
    return this.toGeneratedCalendarDto(row.generated);
  }

  private async findOwnedTimetable(userId: string, timetableId: string) {
    const [row] = await this.databaseService.db
      .select({ timetable: Timetable })
      .from(UserTimetable)
      .innerJoin(
        Timetable,
        eq(UserTimetable.TimetableID, Timetable.timetableID),
      )
      .where(
        and(
          eq(UserTimetable.UserID, userId),
          eq(Timetable.timetableID, timetableId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Timetable not found for id: ${timetableId}`);
    }
    return row.timetable;
  }

  private async findSourceEvents(
    userId: string,
    timetableId: string,
  ): Promise<CalendarSourceEvent[]> {
    const rows = await this.databaseService.db
      .select({
        event: Event,
        moduleId: modules.moduleID,
        moduleCode: modules.moduleCode,
        moduleName: modules.moduleName,
        semester: modules.semester,
        styling: ModuleStyling.styling,
        venueName: Venue.VenueName,
      })
      .from(EventsToTimetables)
      .innerJoin(Event, eq(Event.eventID, EventsToTimetables.eventID))
      .leftJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      .leftJoin(modules, eq(modules.moduleID, UniversityEvent.moduleID))
      .leftJoin(
        ModuleStyling,
        and(
          eq(ModuleStyling.ModuleID, modules.moduleID),
          eq(ModuleStyling.UserID, userId),
        ),
      )
      .leftJoin(EventVenue, eq(EventVenue.EventID, Event.eventID))
      .leftJoin(Venue, eq(Venue.VenueID, EventVenue.VenueID))
      .where(eq(EventsToTimetables.timetableID, timetableId));

    const events = new Map<string, CalendarSourceEvent>();
    for (const row of rows) {
      let event = events.get(row.event.eventID);
      if (!event) {
        event = {
          id: row.event.eventID,
          name: row.event.eventName,
          activityCode: row.event.activityCode,
          activityType: row.event.activityType,
          criteria: row.event.eventCriteria,
          isRecurring: row.event.isRecurring,
          moduleId: row.moduleId,
          moduleCode: row.moduleCode,
          moduleName: row.moduleName,
          semester: row.semester,
          moduleColour: row.styling?.colour || null,
          venues: [],
        };
        events.set(event.id, event);
      }
      if (row.venueName && !event.venues.includes(row.venueName)) {
        event.venues.push(row.venueName);
      }
    }
    return [...events.values()];
  }

  private toGeneratedCalendarDto(
    row: GeneratedCalendarRecord,
  ): GeneratedCalendarDto {
    return {
      id: row.id,
      payload: row.payload,
    };
  }

  private async findCalendar(
    universityId: string,
    id: string,
  ): Promise<AcademicCalendarRecord> {
    const [calendar] = await this.databaseService.db
      .select()
      .from(AcademicCalendar)
      .where(
        and(
          eq(AcademicCalendar.id, id),
          eq(AcademicCalendar.universityId, universityId),
        ),
      )
      .limit(1);
    if (!calendar) this.throwCalendarNotFound(id);
    return calendar;
  }

  private async findCalendarForYear(
    universityId: string,
    year: number,
  ): Promise<AcademicCalendarRecord> {
    const [calendar] = await this.databaseService.db
      .select()
      .from(AcademicCalendar)
      .where(
        and(
          eq(AcademicCalendar.universityId, universityId),
          eq(AcademicCalendar.year, year),
        ),
      )
      .limit(1);
    if (!calendar) {
      throw new NotFoundException(
        `Academic calendar not found for university ${universityId} and year ${year}`,
      );
    }
    return calendar;
  }

  private normalizeRestriction(
    dto: CreateCalendarRestrictionDto,
    calendarYear: number,
  ) {
    const endDate = dto.endDate ?? dto.startDate;
    if (endDate < dto.startDate) {
      throw new UnprocessableEntityException(
        'Restriction endDate must be on or after startDate',
      );
    }

    const expectedYear = String(calendarYear);
    if (
      !dto.startDate.startsWith(`${expectedYear}-`) ||
      !endDate.startsWith(`${expectedYear}-`)
    ) {
      throw new UnprocessableEntityException(
        `Restriction dates must fall within academic calendar year ${calendarYear}`,
      );
    }

    if (dto.type === 'DAY_SWAP') {
      if (!dto.replacementWeekday || endDate !== dto.startDate) {
        this.throwInvalidRestrictionFields(
          'DAY_SWAP requires replacementWeekday and must target one date',
        );
      }
      if (this.weekdayForDate(dto.startDate) === dto.replacementWeekday) {
        throw new ConflictException(
          'A day swap must use a different weekday pattern',
        );
      }
    } else if (dto.replacementWeekday !== undefined) {
      this.throwInvalidRestrictionFields(
        'replacementWeekday is allowed only for DAY_SWAP',
      );
    }

    return {
      type: dto.type,
      startDate: dto.startDate,
      endDate,
      description: dto.description ?? '',
      replacementWeekday: dto.replacementWeekday ?? null,
    };
  }

  private weekdayForDate(date: string): Weekday {
    const weekdays: Weekday[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()];
  }

  private currentYear(): number {
    return Number(
      new Intl.DateTimeFormat('en', {
        year: 'numeric',
        timeZone: TIMEZONE,
      }).format(new Date()),
    );
  }

  private toCalendarDto(row: AcademicCalendarRecord): AcademicCalendarDto {
    return {
      id: row.id,
      year: row.year,
    };
  }

  private toRestrictionDto(
    row: CalendarRestrictionRecord,
  ): CalendarRestrictionDto {
    return {
      id: row.id,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description,
      replacementWeekday: row.replacementWeekday,
    };
  }

  private throwCalendarNotFound(id: string): never {
    throw new NotFoundException(`Academic calendar not found for id: ${id}`);
  }

  private throwRestrictionNotFound(id: string): never {
    throw new NotFoundException(`Calendar restriction not found for id: ${id}`);
  }

  private throwCalendarAlreadyExists(
    universityId: string,
    year: number,
  ): never {
    throw new ConflictException(
      `An academic calendar already exists for university ${universityId} and year ${year}`,
    );
  }

  private throwDuplicateDaySwap(
    academicCalendarId: string,
    startDate: string,
  ): never {
    throw new ConflictException(
      `A day swap already exists for ${startDate} in calendar ${academicCalendarId}`,
    );
  }

  private throwInvalidRestrictionFields(message: string): never {
    throw new UnprocessableEntityException(message);
  }

  private isConstraint(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as DbError).code === code
    );
  }
}
