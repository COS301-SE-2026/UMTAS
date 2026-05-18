import { jsonb, pgTable, serial, uuid } from 'drizzle-orm/pg-core';

export const Event = pgTable('Event', {
  userID: uuid('userID').notNull(),
  eventID: serial('eventID').primaryKey(),
  eventCriteria: jsonb('eventCriteria'),
});
