//Tables
/**
 * lectureCriteriaTable
 * tutorialCriteriaTable
 * labCriteriaTable
 * testCriteriaTable
 * examCriteriaTable
 * bootcampCriteriaTable
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth/auth.schema.js';
import { modulesTable, eventsTable } from './timetable.schema.js';

const recurringCriteriaColumns = {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),

  eventId: uuid('event_id')
    .notNull()
    .references(() => eventsTable.id, { onDelete: 'cascade' }),

  moduleId: uuid('module_id')
    .notNull()
    .references(() => modulesTable.id, { onDelete: 'cascade' }),

  dayOfWeek: smallint('day_of_week').notNull(),

  startTime: time('start_time').notNull(),

  durationMinutes: integer('duration_minutes').notNull(),

  weekStart: integer('week_start').notNull(),

  weekEnd: integer('week_end').notNull(),

  isRecurring: boolean('is_recurring').notNull().default(true),

  location: text('location'),

  lecturer: text('lecturer'),
}; //recurringCriteriaColumns

export const lectureCriteriaTable = pgTable(
  'lecture_criteria',
  recurringCriteriaColumns,
  (table) => ({
    eventIdUniqueIndex: uniqueIndex('lecture_criteria_event_id_unique').on(
      table.eventId,
    ),
    moduleIdIndex: index('lecture_criteria_module_id_idx').on(table.moduleId),
    scheduleIndex: index('lecture_criteria_schedule_idx').on(
      table.dayOfWeek,
      table.startTime,
    ),
  }),
); //lectureCriteriaTable

export const tutorialCriteriaTable = pgTable(
  'tutorial_criteria',
  recurringCriteriaColumns,
  (table) => ({
    eventIdUniqueIndex: uniqueIndex('tutorial_criteria_event_id_unique').on(
      table.eventId,
    ),
    moduleIdIndex: index('tutorial_criteria_module_id_idx').on(table.moduleId),
    scheduleIndex: index('tutorial_criteria_schedule_idx').on(
      table.dayOfWeek,
      table.startTime,
    ),
  }),
); //tutorialCriteriaTable

export const labCriteriaTable = pgTable(
  'lab_criteria',
  recurringCriteriaColumns,
  (table) => ({
    eventIdUniqueIndex: uniqueIndex('lab_criteria_event_id_unique').on(
      table.eventId,
    ),
    moduleIdIndex: index('lab_criteria_module_id_idx').on(table.moduleId),
    scheduleIndex: index('lab_criteria_schedule_idx').on(
      table.dayOfWeek,
      table.startTime,
    ),
  }),
); //labCriteriaTable

export const testCriteriaTable = pgTable(
  'test_criteria',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    eventId: uuid('event_id')
      .notNull()
      .references(() => eventsTable.id, { onDelete: 'cascade' }),

    moduleId: uuid('module_id')
      .notNull()
      .references(() => modulesTable.id, { onDelete: 'cascade' }),

    testDate: date('test_date').notNull(),

    startTime: time('start_time'),

    durationMinutes: integer('duration_minutes').notNull(),

    location: text('location'),

    lecturer: text('lecturer'),

    noOverlapWith: jsonb('no_overlap_with'),
  },
  (table) => ({
    eventIdUniqueIndex: uniqueIndex('test_criteria_event_id_unique').on(
      table.eventId,
    ),
    moduleIdIndex: index('test_criteria_module_id_idx').on(table.moduleId),
  }),
);

export const examCriteriaTable = pgTable(
  'exam_criteria',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    eventId: uuid('event_id')
      .notNull()
      .references(() => eventsTable.id, { onDelete: 'cascade' }),

    moduleId: uuid('module_id')
      .notNull()
      .references(() => modulesTable.id, { onDelete: 'cascade' }),

    examDate: date('exam_date').notNull(),

    startTime: time('start_time'),

    durationMinutes: integer('duration_minutes').notNull(),

    location: text('location'),

    seatingPlan: jsonb('seating_plan'),
  },
  (table) => ({
    eventIdUniqueIndex: uniqueIndex('exam_criteria_event_id_unique').on(
      table.eventId,
    ),
    moduleIdIndex: index('exam_criteria_module_id_idx').on(table.moduleId),
  }),
); //examCriteriaTable

export const bootcampCriteriaTable = pgTable(
  'bootcamp_criteria',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    eventId: uuid('event_id')
      .notNull()
      .references(() => eventsTable.id, { onDelete: 'cascade' }),

    createdBy: uuid('created_by')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    startDatetime: timestamp('start_datetime', {
      withTimezone: true,
    }).notNull(),

    endDatetime: timestamp('end_datetime', { withTimezone: true }).notNull(),

    organiser: text('organiser'),

    location: text('location'),

    notes: text('notes'),
  },
  (table) => ({
    eventIdUniqueIndex: uniqueIndex('bootcamp_criteria_event_id_unique').on(
      table.eventId,
    ),
    createdByIndex: index('bootcamp_criteria_created_by_idx').on(
      table.createdBy,
    ),
  }),
); //bootcampCriteriaTable
