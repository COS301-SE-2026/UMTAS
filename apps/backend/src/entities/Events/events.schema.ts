import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  uuid,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';

export const Event = pgTable('Event', {
  userID: uuid('userID').notNull(),
  eventID: serial('eventID').primaryKey(),
  eventName: varchar('eventName', { length: 32 }),
  eventCode: varchar('eventCode', { length: 10 }),
  eventCriteria: jsonb('eventCriteria'),
  isRecurring: boolean('isRecurring').notNull().default(false),
});

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
  (t) => ({
    pk: primaryKey({ columns: [t.eventID, t.timetableID] }),
  }),
);
