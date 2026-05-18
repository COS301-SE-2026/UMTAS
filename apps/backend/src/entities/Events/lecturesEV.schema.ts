import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { Event } from './events.schema';

export const LectureEv = pgTable('LectureEv', {
  lectureID: serial('lectureID').primaryKey(),
  moduleID: integer('moduleID').references(() => modules.moduleID, {
    onDelete: 'cascade',
  }),
  eventID: integer('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
  venue: varchar('venue', { length: 30 }),
});
