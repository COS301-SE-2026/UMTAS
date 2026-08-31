import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { GeneratedCalendarPayloadDto } from '../../academic_calendar/dto';
import { Timetable } from '../timetables/timetables.schema';
import { AcademicCalendar } from './academic-calendar.schema';

export const GeneratedCalendar = pgTable(
  'GeneratedCalendar',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    academicCalendarId: uuid('academicCalendarId')
      .notNull()
      .references(() => AcademicCalendar.id, { onDelete: 'restrict' }),
    payload: jsonb('payload').$type<GeneratedCalendarPayloadDto>().notNull(),
    timetableId: uuid('timetableId')
      .notNull()
      .references(() => Timetable.timetableID, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('generated_calendar_calendar_timetable_unique').on(
      table.academicCalendarId,
      table.timetableId,
    ),
    index('generated_calendar_timetable_created_at_idx').on(
      table.timetableId,
      table.createdAt,
    ),
  ],
);

export type GeneratedCalendarRecord = typeof GeneratedCalendar.$inferSelect;
export type NewGeneratedCalendarRecord = typeof GeneratedCalendar.$inferInsert;
