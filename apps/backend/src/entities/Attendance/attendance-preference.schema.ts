import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';
import { Event } from '../Events';
import { University } from '../Universities';

export const AttendanceOperatorPreference = pgTable(
  'AttendanceOperatorPreference',
  {
    ownerUserId: uuid('ownerUserId')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
    universityId: uuid('universityId')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    preferredEventId: uuid('preferredEventId')
      .references(() => Event.eventID, { onDelete: 'cascade' })
      .notNull(),
    selectedAt: timestamp('selectedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: 'attendance_operator_preference_pk',
      columns: [table.ownerUserId, table.universityId],
    }),
  ],
);

export type AttendanceOperatorPreferenceEntity =
  typeof AttendanceOperatorPreference.$inferSelect;
