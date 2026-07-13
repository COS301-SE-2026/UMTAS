import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { SolverInput, SolverResult } from 'shared-types';
import { usersTable } from '../auth';

export const solverJob = pgTable(
  'SOLVER_JOB',
  {
    JobID: uuid('JobID').primaryKey(),
    UserID: uuid('UserID')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    SolverProfileKey: varchar('SolverProfileKey', { length: 128 }).notNull(),
    SolveMode: varchar('SolveMode', { length: 32 }).notNull(),
    RequestedEngine: varchar('RequestedEngine', { length: 32 }),
    DeduplicationKey: varchar('DeduplicationKey', { length: 90 }).notNull(),
    AttemptToken: uuid('AttemptToken').notNull(),
    Input: jsonb('Input').$type<SolverInput>().notNull(),
    Status: varchar('Status', { length: 32 }).notNull().default('queued'),
    Result: jsonb('Result').$type<SolverResult | null>(),
    ErrorCode: varchar('ErrorCode', { length: 128 }),
    ErrorMessage: text('ErrorMessage'),
    ErrorDetails: jsonb('ErrorDetails').$type<Record<string, unknown> | null>(),
    CreatedAt: timestamp('CreatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    UpdatedAt: timestamp('UpdatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    EnqueuedAt: timestamp('EnqueuedAt', { withTimezone: true }),
    CompletedAt: timestamp('CompletedAt', { withTimezone: true }),
    FailedAt: timestamp('FailedAt', { withTimezone: true }),
  },
  (table) => ({
    statusIndex: index('solver_job_status_idx').on(table.Status),
    createdAtIndex: index('solver_job_created_at_idx').on(table.CreatedAt),
    duplicateUniqueIndex: uniqueIndex('solver_job_duplicate_unique').on(
      table.UserID,
      table.DeduplicationKey,
    ),
  }),
);

export type SolverJob = typeof solverJob.$inferSelect;
