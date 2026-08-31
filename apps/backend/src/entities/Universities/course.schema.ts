import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  uniqueIndex,
  unique,
} from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { University } from './University.schema';

//Main table defining the "owner" of the grouped modules
export const ModuleGrouping = pgTable('ModuleGrouping', {
  GroupID: uuid('GroupID').primaryKey().defaultRandom(),
  Hash: varchar('Hash', { length: 64 }).unique(),
});

//Course metadata for moduleGrouping
//GroupID is optional - course can exist without a ModuleGrouping - but needs to belong to  university
export const Course = pgTable(
  'Course',
  {
    CourseID: uuid('CourseID').primaryKey().defaultRandom(),
    UniversityID: uuid('UniversityID') // university owns
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    GroupID: uuid('GroupID').references(() => ModuleGrouping.GroupID, {
      onDelete: 'set null',
    }),
    CourseName: varchar('CourseName', { length: 255 }).notNull(),
    Degree: varchar('Degree', { length: 30 }),
    ExternalID: varchar('ExternalID', { length: 255 }),
  },
  (table) => [
    unique('Course_University_ExternalID_Unique').on(
      table.UniversityID,
      table.ExternalID,
    ),
  ],
);

//Join table defining modules grouped together to ModuleGrouping
export const GroupModules = pgTable(
  'GroupModules',
  {
    GroupModuleID: uuid('GroupModuleID').primaryKey().defaultRandom(),
    GroupID: uuid('GroupID')
      .references(() => ModuleGrouping.GroupID, { onDelete: 'cascade' })
      .notNull(),
    ModuleID: uuid('ModuleID')
      .references(() => modules.moduleID, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    groupModuleUnique: uniqueIndex('group_modules_group_module_unique').on(
      table.GroupID,
      table.ModuleID,
    ),
  }),
);

//Metadata for specific module in a grouping when course is defined
export const CourseModule = pgTable('CourseModule', {
  CourseModuleID: uuid('CourseModuleID').primaryKey().defaultRandom(),
  CourseID: uuid('CourseID')
    .references(() => Course.CourseID, { onDelete: 'cascade' })
    .notNull(),
  GroupModuleID: uuid('GroupModuleID')
    .references(() => GroupModules.GroupModuleID, { onDelete: 'cascade' })
    .notNull(),
  Core: boolean('Core').default(false).notNull(),
  SemesterOfStudy: varchar('SemesterOfStudy', { length: 30 }),
  YearOfStudy: integer('YearOfStudy'),
});

// export const Course = pgTable('Course', {
//   CourseID: uuid('courseID').defaultRandom().primaryKey(),
//   CourseName: varchar('courseName', { length: 30 }).notNull(),
//   UniversityID: uuid('UniversityID') // university owns
//     .references(() => University.UniversityID, { onDelete: 'cascade' })
//     .notNull(),
// });

// export const CourseModule = pgTable(
//   'CourseModule',
//   {
//     ModuleID: uuid('ModuleID')
//       .references(() => modules.moduleID, { onDelete: 'cascade' })
//       .notNull(),
//     CourseID: uuid('CourseID')
//       .references(() => Course.CourseID, { onDelete: 'cascade' })
//       .notNull(),
//   },
//   (table) => [primaryKey({ columns: [table.CourseID, table.ModuleID] })],
// );
