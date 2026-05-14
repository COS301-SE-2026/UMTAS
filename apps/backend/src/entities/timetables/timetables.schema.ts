//Tables
/**
 * timetables
 * timetable_entries
 * calender_exports
 * parse_jobs
 */
//ENUMS
/**
 * timetableStatusEnum
 * timetableSourceEnum
 * exportTypeEnum
 * exportStatusEnum
 * jobStatusEnum
 */
import { relations, sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from '../auth/auth.schema.js';
import { academicCalendarsTable } from '../institution/institution.schema.js';
import { eventsTable } from '../modules_events/Modules_Events.schema.js';

export const timetableStatusEnum = pgEnum('timetable_status', [
  'draft',
  'generated',
  'manual',
  'exported',
]); //timetableStatusEnum

export const timetableSourceEnum = pgEnum('timetable_source', [
  'solver',
  'manual',
  'pdf_import',
  'api_import',
]); //timetableSourceEnum

export const exportTypeEnum = pgEnum('export_type', ['google_calendar', 'ics']); //exportTypeEnum

export const exportStatusEnum = pgEnum('export_status', [
  'pending',
  'completed',
  'failed',
]); //exportStatusEnum

export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]); //jobStatusEnum

export const timetablesTable = pgTable(
  'timetables',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    studentId: uuid('student_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    academicCalendarId: uuid('academic_calendar_id')
      .notNull()
      .references(() => academicCalendarsTable.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),

    status: timetableStatusEnum('status').notNull().default('draft'),

    source: timetableSourceEnum('source').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    studentIdIndex: index('timetables_student_id_idx').on(table.studentId),

    academicCalendarIdIndex: index('timetables_academic_calendar_id_idx').on(
      table.academicCalendarId,
    ),
  }),
); //timetablesTable

export const timetableEntriesTable = pgTable(
  'timetable_entries',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    timetableId: uuid('timetable_id')
      .notNull()
      .references(() => timetablesTable.id, { onDelete: 'cascade' }),

    eventId: uuid('event_id')
      .notNull()
      .references(() => eventsTable.id, { onDelete: 'cascade' }),

    resolvedDate: date('resolved_date').notNull(),

    resolvedStartTime: time('resolved_start_time').notNull(),

    resolvedDurationMins: integer('resolved_duration_mins').notNull(),

    resolvedVenue: text('resolved_venue'),
  },
  (table) => ({
    timetableIdIndex: index('timetable_entries_timetable_id_idx').on(
      table.timetableId,
    ),

    resolvedDateIndex: index('timetable_entries_resolved_date_idx').on(
      table.resolvedDate,
    ),

    eventIdIndex: index('timetable_entries_event_id_idx').on(table.eventId),
  }),
); //timetableEntriesTable

export const calendarExportsTable = pgTable(
  'calendar_exports',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    timetableId: uuid('timetable_id')
      .notNull()
      .references(() => timetablesTable.id, { onDelete: 'cascade' }),

    exportType: exportTypeEnum('export_type').notNull(),

    status: exportStatusEnum('status').notNull().default('pending'),

    exportUrl: text('export_url'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    timetableIdIndex: index('calendar_exports_timetable_id_idx').on(
      table.timetableId,
    ),

    statusIndex: index('calendar_exports_status_idx').on(table.status),
  }),
); //calendarExportsTable

export const parseJobsTable = pgTable(
  'parse_jobs',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    academicCalendarId: uuid('academic_calendar_id')
      .notNull()
      .references(() => academicCalendarsTable.id, { onDelete: 'cascade' }),

    sourceType: text('source_type').notNull(),

    sourceFile: text('source_file').notNull(),

    status: jobStatusEnum('status').notNull().default('pending'),

    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    academicCalendarIdIndex: index('parse_jobs_academic_calendar_id_idx').on(
      table.academicCalendarId,
    ),

    statusIndex: index('parse_jobs_status_idx').on(table.status),
  }),
); //parseJobsTable

export const timetablesRelations = relations(
  timetablesTable,
  ({ one, many }) => ({
    student: one(usersTable, {
      fields: [timetablesTable.studentId],
      references: [usersTable.id],
    }),

    academicCalendar: one(academicCalendarsTable, {
      fields: [timetablesTable.academicCalendarId],
      references: [academicCalendarsTable.id],
    }),

    entries: many(timetableEntriesTable),

    exports: many(calendarExportsTable),
  }),
); //timetablesRelations

export const timetableEntriesRelations = relations(
  timetableEntriesTable,
  ({ one }) => ({
    timetable: one(timetablesTable, {
      fields: [timetableEntriesTable.timetableId],
      references: [timetablesTable.id],
    }),

    event: one(eventsTable, {
      fields: [timetableEntriesTable.eventId],
      references: [eventsTable.id],
    }),
  }),
); //timetableEntriesRelations

export const calendarExportsRelations = relations(
  calendarExportsTable,
  ({ one }) => ({
    timetable: one(timetablesTable, {
      fields: [calendarExportsTable.timetableId],
      references: [timetablesTable.id],
    }),
  }),
); //calendarExportsRelations

export const parseJobsRelations = relations(parseJobsTable, ({ one }) => ({
  academicCalendar: one(academicCalendarsTable, {
    fields: [parseJobsTable.academicCalendarId],
    references: [academicCalendarsTable.id],
  }),
})); //parseJobsRelations

export type Timetable = typeof timetablesTable.$inferSelect;
export type NewTimetable = typeof timetablesTable.$inferInsert;

export type TimetableEntry = typeof timetableEntriesTable.$inferSelect;
export type NewTimetableEntry = typeof timetableEntriesTable.$inferInsert;

export type CalendarExport = typeof calendarExportsTable.$inferSelect;
export type NewCalendarExport = typeof calendarExportsTable.$inferInsert;

export type ParseJob = typeof parseJobsTable.$inferSelect;
export type NewParseJob = typeof parseJobsTable.$inferInsert;
