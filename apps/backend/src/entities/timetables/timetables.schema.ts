import {
  pgTable,
  serial,
  varchar,
  uuid,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { Event } from '../Events';

export const Timetable = pgTable('Timetable', {
  timetableID: serial('timetableID').primaryKey(),
  timetableName: varchar('timetableName', { length: 32 }),
  userID: uuid('userID').notNull(),
});

export const EventsToTimetables = pgTable(
  'EventsToTimetables',
  {
    eventID: integer('eventID')
      .notNull()
      .references(() => Event.eventID, { onDelete: 'cascade' }),
    timetableID: integer('timetableID')
      .notNull()
      .references(() => Timetable.timetableID, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.eventID, table.timetableID] })],
);
