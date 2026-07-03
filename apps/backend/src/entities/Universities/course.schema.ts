import { pgTable, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { University } from './University.schema';

//Main table defining the "owner" of the grouped modules
export const ModuleGrouping = pgTable('ModuleGrouping', {
  GroupID: uuid('GroupID').primaryKey().defaultRandom(),
  Hash: varchar('Hash', { length: 64 }).unique(),
});

//Course metadata for moduleGrouping
//GroupID is optional - course can exist without a ModuleGrouping - but needs to belong to  university
export const Course = pgTable('Course', {
  CourseID: uuid('courseID').primaryKey().defaultRandom(),
  UniversityID: uuid('UniversityID') // university owns
    .references(() => University.UniversityID, { onDelete: 'cascade' })
    .notNull(),
  GroupID: uuid('GroupID').references(() => ModuleGrouping.GroupID, {
    onDelete: 'set null',
  }),
  CourseName: varchar('courseName', { length: 30 }).notNull(),
  Degree: varchar('Degree', { length: 30 }),
});

//Join table defining modules grouped together to ModuleGrouping
export const GroupModules = pgTable('GroupModules', {
  GroupModuleID: uuid('GroupModuleID').primaryKey().defaultRandom(),
  GroupID: uuid('GroupID')
    .references(() => ModuleGrouping.GroupID, { onDelete: 'cascade' })
    .notNull(),
  ModuleID: uuid('ModuleID')
    .references(() => modules.moduleID, { onDelete: 'cascade' })
    .notNull(),
});

export const CourseModule = pgTable(
  'CourseModule',
  {
    ModuleID: uuid('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
    CourseID: uuid('CourseID')
      .references(() => Course.CourseID, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.CourseID, table.ModuleID] })],
);
