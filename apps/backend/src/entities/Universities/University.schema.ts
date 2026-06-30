import {
  pgTable,
  varchar,
  uuid,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';

export const RoleType = pgEnum('RoleType', [
  'STUDENT',
  'UNIVERSITY_ADMIN',
  'SYSTEM_ADMIN',
  'STUDENT_OWNED',
]); // student owned is == uni admin maybe just to be precise?

export const University = pgTable('University', {
  UniversityID: uuid('UniversityID').defaultRandom().primaryKey(),
  UniversityName: varchar('UniversityName', { length: 30 }).notNull(),
});

export const UniversityRole = pgTable(
  'UniversityRole',
  {
    UserID: uuid('UserID')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
    UniversityID: uuid('UniversityID')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    role: RoleType('role').notNull().default('STUDENT'),
  },
  (table) => [primaryKey({ columns: [table.UniversityID, table.UserID] })],
);
