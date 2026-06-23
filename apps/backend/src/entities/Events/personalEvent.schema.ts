import { integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
import { Event } from './events.schema';
import { usersTable } from '../auth';

export const PeronsalEvent = pgTable('PersonalEvent', {
  PersonalEventID: serial('universityEventID').primaryKey(),
  UserID: uuid('UserID').references(() => usersTable.id, {
    onDelete: 'cascade',
  }),
  eventID: integer('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
});
