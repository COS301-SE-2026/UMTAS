import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { University } from '../Universities/University.schema';

export const AcademicCalendar = pgTable(
  'AcademicCalendar',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    universityId: uuid('universityId')
      .notNull()
      .references(() => University.UniversityID, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('academic_calendar_university_year_unique').on(
      table.universityId,
      table.year,
    ),
    check(
      'academic_calendar_year_four_digits',
      sql`${table.year} between 1000 and 9999`,
    ),
  ],
);

export type AcademicCalendarRecord = typeof AcademicCalendar.$inferSelect;
export type NewAcademicCalendarRecord = typeof AcademicCalendar.$inferInsert;
