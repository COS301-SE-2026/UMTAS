import {
  pgTable,
  serial,
  varchar,
  uuid,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { UniversityEvent } from '../Events';
import { usersTable } from '../auth';

export const Timetable = pgTable('Timetable', {
  timetableID: serial('timetableID').primaryKey(),
  timetableName: varchar('timetableName', { length: 32 }),
  userID: uuid('userID')
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
});

export const EventsToTimetables = pgTable(
  'EventsToTimetables',
  {
    eventID: integer('eventID')
      .notNull()
      .references(() => UniversityEvent.UniversityEventID, {
        onDelete: 'cascade',
      }), // changed to link specifically to a Uni child event it should not break....
    timetableID: integer('timetableID')
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
  TimetableID: integer('TimetableID')
    .references(() => Timetable.timetableID)
    .notNull(),
});
