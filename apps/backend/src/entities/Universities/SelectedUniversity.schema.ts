import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';
import { University } from './University.schema';
import { RoleType } from './University.schema';

export const SelectedUniversity = pgTable(
  'SelectedUniversity',
  {
    UserID: uuid('UserID')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
    UniversityID: uuid('UniversityID')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    role: RoleType('role').notNull().default('STUDENT'),
  },
  (table) => [primaryKey({ columns: [table.UserID] })],
);

export type SelectedUniversityType = typeof SelectedUniversity;
