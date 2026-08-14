import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, eq, ne } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import {
  AcademicCalendar,
  type AcademicCalendarRecord,
  CalendarRestriction,
  type CalendarRestrictionRecord,
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
  UpdateAcademicCalendarDto,
  UpdateCalendarRestrictionDto,
} from './dto';

type DbError = { code?: string; constraint?: string };

@Injectable()
export class AcademicCalendarService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createCalendar(
    universityId: string,
    dto: CreateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    const db = this.databaseService.db;

    const [duplicate] = await db
      .select({ id: AcademicCalendar.id })
      .from(AcademicCalendar)
      .where(
        and(
          eq(AcademicCalendar.universityId, universityId),
          eq(AcademicCalendar.year, dto.year),
        ),
      )
      .limit(1);

    if (duplicate) this.throwCalendarAlreadyExists(universityId, dto.year);

    try {
      const [created] = await db
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

  async updateCalendar(
    universityId: string,
    id: string,
    dto: UpdateAcademicCalendarDto,
  ): Promise<AcademicCalendarDto> {
    await this.findCalendar(universityId, id);

    const [duplicate] = await this.databaseService.db
      .select({ id: AcademicCalendar.id })
      .from(AcademicCalendar)
      .where(
        and(
          eq(AcademicCalendar.universityId, universityId),
          eq(AcademicCalendar.year, dto.year),
          ne(AcademicCalendar.id, id),
        ),
      )
      .limit(1);

    if (duplicate) this.throwCalendarAlreadyExists(universityId, dto.year);

    try {
      const [updated] = await this.databaseService.db
        .update(AcademicCalendar)
        .set({
          year: dto.year,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(AcademicCalendar.id, id),
            eq(AcademicCalendar.universityId, universityId),
          ),
        )
        .returning();

      if (!updated) this.throwCalendarNotFound(id);
      return this.toCalendarDto(updated);
    } catch (error) {
      if (this.isConstraint(error, '23505')) {
        this.throwCalendarAlreadyExists(universityId, dto.year);
      }
      throw error;
    }
  }

  async deleteCalendar(
    universityId: string,
    id: string,
  ): Promise<DeleteAcademicCalendarResponseDto> {
    await this.findCalendar(universityId, id);

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
    await this.findCalendar(universityId, academicCalendarId);
    const values = this.normalizeRestriction(dto);

    if (values.type === 'DAY_SWAP') {
      await this.assertDaySwapTargetAvailable(
        academicCalendarId,
        values.startDate,
      );
    }

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
    await this.findCalendar(universityId, academicCalendarId);
    await this.findRestriction(academicCalendarId, restrictionId);
    const values = this.normalizeRestriction(dto);

    if (values.type === 'DAY_SWAP') {
      await this.assertDaySwapTargetAvailable(
        academicCalendarId,
        values.startDate,
        restrictionId,
      );
    }

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

  generateCalendar(dto: GenerateCalendarDto): Promise<GeneratedCalendarDto> {
    void dto;
    return this.generationNotImplemented();
  }

  getGeneratedCalendar(id: string): Promise<GeneratedCalendarDto> {
    void id;
    return this.generationNotImplemented();
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

  private async findRestriction(
    academicCalendarId: string,
    restrictionId: string,
  ): Promise<CalendarRestrictionRecord> {
    const [restriction] = await this.databaseService.db
      .select()
      .from(CalendarRestriction)
      .where(
        and(
          eq(CalendarRestriction.id, restrictionId),
          eq(CalendarRestriction.academicCalendarId, academicCalendarId),
        ),
      )
      .limit(1);
    if (!restriction) this.throwRestrictionNotFound(restrictionId);
    return restriction;
  }

  private normalizeRestriction(dto: CreateCalendarRestrictionDto) {
    const endDate = dto.endDate ?? dto.startDate;
    if (endDate < dto.startDate) {
      throw new UnprocessableEntityException(
        'Restriction endDate must be on or after startDate',
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

  private async assertDaySwapTargetAvailable(
    academicCalendarId: string,
    startDate: string,
    excludedRestrictionId?: string,
  ): Promise<void> {
    const conditions = [
      eq(CalendarRestriction.academicCalendarId, academicCalendarId),
      eq(CalendarRestriction.type, 'DAY_SWAP'),
      eq(CalendarRestriction.startDate, startDate),
    ];
    if (excludedRestrictionId) {
      conditions.push(ne(CalendarRestriction.id, excludedRestrictionId));
    }

    const [duplicate] = await this.databaseService.db
      .select({ id: CalendarRestriction.id })
      .from(CalendarRestriction)
      .where(and(...conditions))
      .limit(1);
    if (duplicate) this.throwDuplicateDaySwap(academicCalendarId, startDate);
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

  private toCalendarDto(row: AcademicCalendarRecord): AcademicCalendarDto {
    return {
      id: row.id,
      universityId: row.universityId,
      year: row.year,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toRestrictionDto(
    row: CalendarRestrictionRecord,
  ): CalendarRestrictionDto {
    return {
      id: row.id,
      academicCalendarId: row.academicCalendarId,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description,
      replacementWeekday: row.replacementWeekday,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
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

  private generationNotImplemented(): never {
    throw new NotImplementedException(
      'Academic calendar generation is not implemented yet',
    );
  }
}
