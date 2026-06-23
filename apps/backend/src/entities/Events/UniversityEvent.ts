import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { Event } from './events.schema';

export const UniversityEvent = pgTable('UniversityEvent', {
  UniversityEventID: serial('universityEventID').primaryKey(),
  moduleID: integer('moduleID').references(() => modules.moduleID, {
    onDelete: 'cascade',
  }),
  eventID: integer('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
  venue: varchar('venue', { length: 30 }),
});
