//Tables
/**
 * Enrollments
 * Enrollment_choices
 */
//ENUMS
/**
 * choice_status
 */
import { relations, sql } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { usersTable } from '../auth/auth.schema.js';
import { modulesTable, eventsTable } from './Modules_Events.schema.js';

export const choiceStatusEnum = pgEnum('choice_status', [
  'selected',
  'alternative',
  'rejected',
]); //choiceStatusEnum

export const enrollmentsTable = pgTable(
  'enrollments',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    studentId: uuid('student_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    moduleId: uuid('module_id')
      .notNull()
      .references(() => modulesTable.id, { onDelete: 'cascade' }),

    enrolledAt: timestamp('enrolled_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    studentIdIndex: index('enrollments_student_id_idx').on(table.studentId),

    moduleIdIndex: index('enrollments_module_id_idx').on(table.moduleId),

    studentModuleUniqueIndex: uniqueIndex(
      'enrollments_student_module_unique',
    ).on(table.studentId, table.moduleId),
  }),
); //enrollmentsTable

export const enrollmentChoicesTable = pgTable(
  'enrollment_choices',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey(),

    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollmentsTable.id, { onDelete: 'cascade' }),

    eventId: uuid('event_id')
      .notNull()
      .references(() => eventsTable.id, { onDelete: 'cascade' }),

    status: choiceStatusEnum('status').notNull(),

    chosenAt: timestamp('chosen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    enrollmentIdIndex: index('enrollment_choices_enrollment_id_idx').on(
      table.enrollmentId,
    ),

    eventIdIndex: index('enrollment_choices_event_id_idx').on(table.eventId),

    enrollmentEventUniqueIndex: uniqueIndex(
      'enrollment_choices_enrollment_event_unique',
    ).on(table.enrollmentId, table.eventId),
  }),
); //enrollmentChoicesTable

export const enrollmentsRelations = relations(
  enrollmentsTable,
  ({ one, many }) => ({
    student: one(usersTable, {
      fields: [enrollmentsTable.studentId],
      references: [usersTable.id],
    }),

    module: one(modulesTable, {
      fields: [enrollmentsTable.moduleId],
      references: [modulesTable.id],
    }),

    choices: many(enrollmentChoicesTable),
  }),
);

export const enrollmentChoicesRelations = relations(
  enrollmentChoicesTable,
  ({ one }) => ({
    enrollment: one(enrollmentsTable, {
      fields: [enrollmentChoicesTable.enrollmentId],
      references: [enrollmentsTable.id],
    }),

    event: one(eventsTable, {
      fields: [enrollmentChoicesTable.eventId],
      references: [eventsTable.id],
    }),
  }),
); //enrollmentChoicesRelations

export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type NewEnrollment = typeof enrollmentsTable.$inferInsert;

export type EnrollmentChoice = typeof enrollmentChoicesTable.$inferSelect;
export type NewEnrollmentChoice = typeof enrollmentChoicesTable.$inferInsert;
