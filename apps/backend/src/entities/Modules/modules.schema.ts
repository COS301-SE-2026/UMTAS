import {
  integer,
  jsonb,
  pgTable,
  serial,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const modules = pgTable('Modules', {
  moduleID: serial('moduleID').primaryKey(),
  moduleCode: varchar('moduleCode', { length: 6 }).notNull(),
  moduleName: varchar('moduleName', { length: 256 }).notNull(),
  styling: jsonb('styling'),
  userID: uuid('userID').notNull(),
  timetableID: integer('timetableID').references(() => timetable.timetableID, {
    onDelete: 'cascade',
  }),
});

export const timetable = pgTable('Timetable', {
  timetableID: serial('timetableID').primaryKey(),
  timetableName: varchar('timetableName'),
});
