import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';

export const helloWorldTable = pgTable('hello_world', {
  id: uuid('id').$defaultFn(randomUUID).primaryKey(),
  message: text('message').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type HelloWorld = typeof helloWorldTable.$inferSelect;
