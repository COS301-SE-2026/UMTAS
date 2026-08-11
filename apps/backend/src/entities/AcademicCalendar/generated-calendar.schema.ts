import { index, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { GeneratedCalendarPayloadDto } from '../../academic_calendar/dto';
import { Timetable } from '../timetables/timetables.schema';
import { University } from '../Universities/University.schema';
import { AcademicCalendar } from './academic-calendar.schema';

export const GeneratedCalendar = pgTable(
  'GeneratedCalendar',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    academicCalendarId: uuid('academicCalendarId')
      .notNull()
      .references(() => AcademicCalendar.id, { onDelete: 'restrict' }),
    generatedAt: timestamp('generatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    payload: jsonb('payload').$type<GeneratedCalendarPayloadDto>().notNull(),
    timetableId: uuid('timetableId')
      .notNull()
      .references(() => Timetable.timetableID, { onDelete: 'cascade' }),
    universityId: uuid('universityId')
      .notNull()
      .references(() => University.UniversityID, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('generated_calendar_timetable_generated_at_idx').on(
      table.timetableId,
      table.generatedAt,
    ),
  ],
);

export type GeneratedCalendarRecord = typeof GeneratedCalendar.$inferSelect;
export type NewGeneratedCalendarRecord = typeof GeneratedCalendar.$inferInsert;
