import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import {
  AcademicCalendar,
  CalendarRestriction,
  University,
} from '../../../entities';
import type { DatabaseService } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';
import { SeedPersistenceService } from '../seed-persistence.service';

@Injectable()
export class AcademicCalendarSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(db: DatabaseService['db']): Promise<void> {
    const seed = this.constants.AcademicCalendarSeed;
    const [university] = await db
      .select({ id: University.UniversityID })
      .from(University)
      .where(eq(University.UniversityName, seed.universityName))
      .limit(1);

    if (!university) {
      this.logger.warn(
        `Skipping academic calendar seed: ${seed.universityName} was not found`,
      );
      return;
    }

    let [calendar] = await db
      .select()
      .from(AcademicCalendar)
      .where(
        and(
          eq(AcademicCalendar.universityId, university.id),
          eq(AcademicCalendar.year, seed.year),
        ),
      )
      .limit(1);

    if (!calendar) {
      [calendar] = await this.persistence.insertAcademicCalendars(db, [
        { universityId: university.id, year: seed.year },
      ]);
    }

    if (calendar.subscriptions.length === 0) {
      const publicSeed = this.constants.PublicCalendarsSeed.find(
        (item) => item.year === seed.year,
      );
      if (publicSeed) {
        const [publicCalendar] = await db
          .select({ id: AcademicCalendar.id })
          .from(AcademicCalendar)
          .where(
            and(
              isNull(AcademicCalendar.universityId),
              eq(AcademicCalendar.name, publicSeed.name),
              eq(AcademicCalendar.year, publicSeed.year),
            ),
          )
          .limit(1);

        if (publicCalendar) {
          await db
            .update(AcademicCalendar)
            .set({ subscriptions: [publicCalendar.id] })
            .where(eq(AcademicCalendar.id, calendar.id));
          calendar.subscriptions = [publicCalendar.id];
        } else {
          this.logger.warn(
            `Skipping academic calendar subscription: ${publicSeed.name} was not found`,
          );
        }
      }
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
    }

    this.logResult('academic-calendar restrictions', missing.length);
  }
}
