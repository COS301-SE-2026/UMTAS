import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { AcademicCalendar, CalendarRestriction } from '../../../entities';
import type { DatabaseService } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';

@Injectable()
export class PublicCalendarSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(db: DatabaseService['db']): Promise<void> {
    let insertedRestrictions = 0;

    for (const seed of this.constants.PublicCalendarsSeed) {
      let [calendar] = await db
        .select()
        .from(AcademicCalendar)
        .where(
          and(
            isNull(AcademicCalendar.universityId),
            eq(AcademicCalendar.name, seed.name),
            eq(AcademicCalendar.year, seed.year),
          ),
        )
        .limit(1);

      if (!calendar) {
        [calendar] = await this.persistence.insertAcademicCalendars(db, [
          { universityId: null, name: seed.name, year: seed.year },
        ]);
      }

      const existing = await db
        .select({
          type: CalendarRestriction.type,
          startDate: CalendarRestriction.startDate,
        })
        .from(CalendarRestriction)
        .where(eq(CalendarRestriction.academicCalendarId, calendar.id));
      const existingKeys = new Set(
        existing.map((row) => `${row.type}:${row.startDate}`),
      );
      const missing = seed.restrictions.filter(
        (restriction) =>
          !existingKeys.has(`${restriction.type}:${restriction.startDate}`),
      );

      if (missing.length > 0) {
        await this.persistence.insertCalendarRestrictions(
          db,
          missing.map((restriction) => ({
            academicCalendarId: calendar.id,
            ...restriction,
          })),
        );
        insertedRestrictions += missing.length;
      }
    }

    this.logResult('public-calendar restrictions', insertedRestrictions);
  }
}
