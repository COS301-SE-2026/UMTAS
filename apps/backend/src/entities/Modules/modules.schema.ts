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
  moduleID: uuid('moduleID').defaultRandom().primaryKey(),
  moduleCode: varchar('moduleCode', { length: 10 }).notNull(),
  moduleName: varchar('moduleName', { length: 256 }).notNull(),
  moduleDescription: text('moduleDescription'),
});

export const ModuleEnrollment = pgTable(
  'ModuleEnrollment',
  {
    ModuleID: uuid('ModuleID')
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
    ModuleID: uuid('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    UserID: uuid('UserID')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.ModuleID, table.UserID] })],
);

export const ModuleStyling = pgTable(
  'ModuleStyling',
  {
    ModuleID: integer('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
      //should belong to user not userTimetable
    UserTimetableID: uuid('UserTimetableID')
      .references(() => UserTimetable.UserTimetableID, { onDelete: 'cascade' }),
    styling: jsonb('styling')
      .notNull()
      .$type<{ colour: string }>()
      .default({ colour: '' }),
  },
  (table) => [primaryKey({ columns: [table.ModuleID, table.UserTimetableID] })],
);
