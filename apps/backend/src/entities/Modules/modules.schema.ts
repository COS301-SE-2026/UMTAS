import {
  pgTable,
  serial,
  text,
  uuid,
  varchar,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';

export const modules = pgTable('Modules', {
  moduleID: serial('moduleID').primaryKey(),
  moduleCode: varchar('moduleCode', { length: 10 }).notNull(),
  moduleName: varchar('moduleName', { length: 256 }).notNull(),
  moduleDescription: text('moduleDescription'),
  styling: varchar('styling', { length: 32 }),
  userID: uuid('userID').notNull(),
});

export const ModuleEnrollment = pgTable(
  'ModuleEnrollment',
  {
    ModuleID: uuid('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    UserID: uuid('UniversityID')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.ModuleID, table.UserID] })],
);
