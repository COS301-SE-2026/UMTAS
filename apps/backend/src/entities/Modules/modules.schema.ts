import {
  boolean,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
  primaryKey,
  uniqueIndex,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';

export const AcademicSemester = pgEnum('AcademicSemester', [
  'SEMESTER_1',
  'SEMESTER_2',
  'YEAR',
]);

export type AcademicSemesterType = (typeof AcademicSemester.enumValues)[number];

export const modules = pgTable(
  'Modules',
  {
    moduleID: uuid('moduleID').defaultRandom().primaryKey(),
    moduleCode: varchar('moduleCode', { length: 15 }).notNull(),
    moduleName: varchar('moduleName', { length: 256 }).notNull(),
    moduleDescription: text('moduleDescription'),
    semester: AcademicSemester('semester'),
    validated: boolean('validated').notNull().default(true),
    ExternalID: varchar('ExternalID', { length: 255 }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    moduleCodeUnique: uniqueIndex('moduleCode_unique_index').on(
      table.moduleCode,
    ),
  }),
);

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
    ModuleID: uuid('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    //should belong to user not userTimetable
    UserID: uuid('UserID').references(() => usersTable.id, {
      onDelete: 'cascade',
    }),
    styling: jsonb('styling')
      .notNull()
      .$type<{ colour: string }>()
      .default({ colour: '' }),
  },
  (table) => [primaryKey({ columns: [table.ModuleID, table.UserID] })],
);
