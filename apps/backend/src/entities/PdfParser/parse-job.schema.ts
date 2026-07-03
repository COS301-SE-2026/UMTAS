import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { PdfParserResult } from 'shared-types';
import { usersTable } from '../auth';
import { University } from '../Universities';

export const parseJob = pgTable(
  'PARSE_JOB',
  {
    JobID: uuid('JobID').primaryKey(),
    UserID: uuid('UserID')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    UniversityID: uuid('UniversityID')
      .notNull()
      .references(() => University.UniversityID, { onDelete: 'cascade' }),
    AdapterKey: varchar('AdapterKey', { length: 64 }).notNull(),
    FileKey: text('FileKey'),
    ClientPdfStreamHash: varchar('ClientPdfStreamHash', { length: 64 }),
    PdfStreamHash: varchar('PdfStreamHash', { length: 64 }).notNull(),
    FingerprintAlgorithm: varchar('FingerprintAlgorithm', {
      length: 128,
    }).notNull(),
    StreamCount: integer('StreamCount').notNull(),
    Status: varchar('Status', { length: 32 }).notNull().default('queued'),
    Result: jsonb('Result').$type<PdfParserResult | null>(),
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
    userIndex: index('parse_job_user_id_idx').on(table.UserID),
    statusIndex: index('parse_job_status_idx').on(table.Status),
    createdAtIndex: index('parse_job_created_at_idx').on(table.CreatedAt),
    duplicateUniqueIndex: uniqueIndex('parse_job_duplicate_unique').on(
      table.UserID,
      table.UniversityID,
      table.AdapterKey,
      table.FingerprintAlgorithm,
      table.PdfStreamHash,
    ),
  }),
);

export type ParseJob = typeof parseJob.$inferSelect;
