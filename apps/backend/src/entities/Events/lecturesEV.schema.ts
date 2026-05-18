import { pgTable, serial } from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { Event } from './events.schema';
export const LectureEv = pgTable('lectureEv', {
  lectureID: serial('lectureID').primaryKey(),
  moduleID: serial('moduleID').references(() => modules.moduleID, {
    onDelete: 'cascade',
  }),
  eventID: serial('eventID').references(() => Event.eventID, {
    onDelete: 'cascade',
  }),
});
