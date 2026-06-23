import { pgTable, uuid, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { University } from './University.schema';

export const AcademicCalendar = pgTable('AcademicCalendar', {
  CalendarID: uuid('CalendarID').defaultRandom().primaryKey(),
  UniversityID: uuid('UniversityID').references(() => University.UniversityID, {
    onDelete: 'cascade',
  }),
  CreationDate: timestamp('CreationDate').defaultNow().notNull(),
});

export const RestrictedDates = pgTable('RestrictedDates', {
  RestrictionID: uuid('RestrictionID').defaultRandom().primaryKey(),
  CalandarID: uuid('CalendarID')
    .references(() => AcademicCalendar.CalendarID, { onDelete: 'cascade' })
    .notNull(),
  Details: jsonb('Details')
    .$type<{ dateStart: string; dateEnd?: string; dayReplacement?: string }>()
    .default({ dateStart: '' }),
});

export const RestrictionType = pgEnum('RestrictionType', [
  'DATE-SWAP',
  'PUBLIC-HOLIDAY',
  'RECESS',
  'CLOSURE',
  'EXAM-PERIOD',
  'DAY-SWAP',
]);
