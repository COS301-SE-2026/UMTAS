import {
  pgTable,
  varchar,
  uuid,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { Event } from '../Events';
import { usersTable } from '../auth';

export const Timetable = pgTable('Timetable', {
  timetableID: uuid('timetableID').unique().primaryKey().defaultRandom(),
  timetableName: varchar('timetableName', { length: 32 }),
});

export const EventsToTimetables = pgTable(
  'EventsToTimetables',
  {
    eventID: uuid('eventID')
      .notNull()
      .references(() => Event.eventID, {
        onDelete: 'cascade',
      }),
    timetableID: uuid('timetableID')
      .notNull()
      .references(() => Timetable.timetableID, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.eventID, table.timetableID] })],
);

export const UserTimetable = pgTable('UserTimetable', {
  UserTimetableID: uuid('UserTimetableID').defaultRandom().primaryKey(),
  UserID: uuid('UserID')
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  TimetableID: uuid('TimetableID')
    .references(() => Timetable.timetableID, { onDelete: 'cascade' })
    .notNull(),
});
