import { integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { Event } from './events.schema';
export const LectureEv = pgTable('lectureEv', {
  lectureID: serial('lectureID').primaryKey(),
  moduleID: integer('moduleID').references(() => modules.moduleID, {
    onDelete: 'cascade',
  }),
  eventID: integer('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
});
