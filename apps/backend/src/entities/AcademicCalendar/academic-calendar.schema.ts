import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { University } from '../Universities/University.schema';

export const AcademicCalendar = pgTable(
  'AcademicCalendar',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    universityId: uuid('universityId').references(
      () => University.UniversityID,
      { onDelete: 'cascade' },
    ),
    name: text('name'),
    year: integer('year').notNull(),
    subscriptions: jsonb('subscriptions')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
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
    uniqueIndex('academic_calendar_public_name_year_unique')
      .on(table.name, table.year)
      .where(sql`${table.universityId} is null`),
    check(
      'academic_calendar_year_four_digits',
      sql`${table.year} between 1000 and 9999`,
    ),
    check(
      'academic_calendar_public_requires_name',
      sql`${table.universityId} is not null or ${table.name} is not null`,
    ),
    check(
      'academic_calendar_public_no_subscriptions',
      sql`${table.universityId} is not null or ${table.subscriptions} = '[]'::jsonb`,
    ),
  ],
);

export type AcademicCalendarRecord = typeof AcademicCalendar.$inferSelect;
export type NewAcademicCalendarRecord = typeof AcademicCalendar.$inferInsert;
