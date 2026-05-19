import { pgTable, serial, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const modules = pgTable('Modules', {
  moduleID: serial('moduleID').primaryKey(),
  moduleCode: varchar('moduleCode', { length: 10 }).notNull(),
  moduleName: varchar('moduleName', { length: 256 }).notNull(),
  moduleDescription: text('moduleDescription'),
  styling: varchar('styling', { length: 32 }),
  userID: uuid('userID').notNull(),
});
