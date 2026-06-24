import { jsonb, pgTable, serial, varchar, boolean } from 'drizzle-orm/pg-core';

export const Event = pgTable('Event', {
  eventID: serial('eventID').primaryKey(),
  eventName: varchar('eventName', { length: 32 }),
  eventCode: varchar('eventCode', { length: 10 }),
  eventCriteria: jsonb('eventCriteria'),
  isRecurring: boolean('isRecurring').notNull().default(false),
});
