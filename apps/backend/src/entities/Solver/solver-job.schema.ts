import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type { SolverResult } from 'shared-types';

export const solverJob = pgTable(
  'SOLVER_JOB',
  {
    JobID: varchar('JobID', { length: 255 }).primaryKey(),
    SolverProfileKey: varchar('SolverProfileKey', { length: 128 }).notNull(),
    SolveMode: varchar('SolveMode', { length: 32 }).notNull(),
    RequestedEngine: varchar('RequestedEngine', { length: 32 }),
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
    CompletedAt: timestamp('CompletedAt', { withTimezone: true }),
    FailedAt: timestamp('FailedAt', { withTimezone: true }),
  },
  (table) => ({
    statusIndex: index('solver_job_status_idx').on(table.Status),
    createdAtIndex: index('solver_job_created_at_idx').on(table.CreatedAt),
  }),
);

export type SolverJob = typeof solverJob.$inferSelect;
