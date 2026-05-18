import {
  jsonb,
  pgTable,
  serial,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const modules = pgTable('Modules', {
  moduleID: serial('moduleID').primaryKey(),
  moduleCode: varchar('moduleCode', { length: 6 }).notNull(),
  moduleName: varchar('moduleName', { length: 256 }).notNull(),
  moduleDescription: text('moduleDescription'),
  styling: jsonb('styling'),
  userID: uuid('userID').notNull(),
});
