import { pgTable, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { modules } from '../Modules';
import { University } from './University.schema';

export const Course = pgTable('Course', {
  CourseID: uuid('courseID').defaultRandom().primaryKey(),
  CourseName: varchar('courseName', { length: 30 }).notNull(),
  UniversityID: uuid('UniversityID') // university owns
    .references(() => University.UniversityID, { onDelete: 'cascade' })
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
