import {
  jsonb,
  pgTable,
  uuid,
  varchar,
  boolean,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';
import { Venue } from '../Universities';
import { modules } from '../Modules';

import type { EventCriteria } from 'src/Events/dto/event.types';

export const Event = pgTable('Event', {
  eventID: uuid('eventID').primaryKey().defaultRandom(),
  eventName: varchar('eventName', { length: 32 }).notNull(),
  eventCode: varchar('eventCode', { length: 10 }),
  eventCriteria: jsonb('eventCriteria').$type<EventCriteria>().notNull(),
  isRecurring: boolean('isRecurring').notNull().default(false),
  validated: boolean('validated').notNull().default(true),
});

//Personal owned
export const PersonalEvent = pgTable('PersonalEvent', {
  PersonalEventID: uuid('PersonalEventID').primaryKey().defaultRandom(),
  UserID: uuid('UserID').references(() => usersTable.id, {
    onDelete: 'cascade',
  }),
  eventID: uuid('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
});

//University owned
export const UniversityEvent = pgTable('UniversityEvent', {
  UniversityEventID: uuid('universityEventID').primaryKey().defaultRandom(),
  moduleID: uuid('moduleID').references(() => modules.moduleID, {
    onDelete: 'cascade',
  }),
  eventID: uuid('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
  VenueID: uuid('VenueID').references(() => Venue.VenueID, {
    onDelete: 'cascade',
  }),
});

export const AttendanceState = pgEnum('AttendanceState', [
  'ATTENDING',
  'NOT_ATTENDING',
]);

export type AttendanceStateType = (typeof AttendanceState.enumValues)[number];

export const EventAttendance = pgTable('EventAttendance', {
  AttendanceID: uuid('attendanceID').primaryKey().defaultRandom(),
  eventID: uuid('eventID')
    .references(() => Event.eventID, {
      onDelete: 'cascade',
    })
    .notNull(),
  UserID: uuid('UserID')
    .references(() => usersTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  eventDate: date('eventDate').notNull(),
  state: AttendanceState('state').notNull().default('NOT_ATTENDING'),
});
