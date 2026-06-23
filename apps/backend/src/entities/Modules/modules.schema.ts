import {
  pgTable,
  serial,
  text,
  uuid,
  varchar,
  primaryKey,
  integer,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';
import { UserTimetable } from '../timetables';
import { jsonb } from 'drizzle-orm/pg-core';

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
    ModuleID: integer('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    UserID: uuid('UserID')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.ModuleID, table.UserID] })],
);

export const ModuleTeaches = pgTable(
  'ModuleTeaches',
  {
    ModuleID: integer('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    UserID: uuid('UserID')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.ModuleID, table.UserID] })],
);

export const ModuleStyling = pgTable('ModuleStyling', {
  ModuleID: integer('ModuleID')
    .references(() => modules.moduleID, { onDelete: 'cascade' })
    .notNull(),
  UserTimetableID: uuid('UserTimetableID')
    .references(() => UserTimetable.TimetableID, { onDelete: 'cascade' })
    .notNull(),
  styling: jsonb('styling')
    .notNull()
    .$type<{ colour: string }>()
    .default({ colour: '' }),
});
