// Tables
/**
 * modules
 * events
 */
//ENUMS
/**
 * event_type
 */

import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { academicCalendarsTable } from '../institution/institution.schema.js';

export const eventTypeEnum = pgEnum('event_type', [
  'lecture',
  'tutorial',
  'lab',
  'test',
  'exam',
  'bootcamp',
]); //eventTypeEnum

export const modulesTable = pgTable(
  'modules',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    academicCalendarId: uuid('academic_calendar_id')
      .notNull()
      .references(() => academicCalendarsTable.id, { onDelete: 'cascade' }),

    parseJobId: uuid('parse_job_id'),

    code: text('code').notNull(),

    name: text('name').notNull(),

    faculty: text('faculty'),

    semesterLabel: text('semester_label').notNull(),

    year: integer('year').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    academicCalendarIdIndex: index('modules_academic_calendar_id_idx').on(
      table.academicCalendarId,
    ),

    calendarCodeUniqueIndex: uniqueIndex('modules_calendar_code_unique').on(
      table.academicCalendarId,
      table.code,
    ),
  }),
); //modulesTable

export const eventsTable = pgTable(
  'events',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    type: eventTypeEnum('type').notNull(),

    title: text('title').notNull(),

    isCancelled: boolean('is_cancelled').notNull().default(false),

    details: jsonb('details'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    typeIndex: index('events_type_idx').on(table.type),
  }),
); //eventsTable

export const modulesRelations = relations(modulesTable, ({ one }) => ({
  academicCalendar: one(academicCalendarsTable, {
    fields: [modulesTable.academicCalendarId],
    references: [academicCalendarsTable.id],
  }),
})); //modulesRelations

export type Module = typeof modulesTable.$inferSelect;
export type NewModule = typeof modulesTable.$inferInsert;

export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;
