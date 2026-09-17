import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';
import { University } from '../Universities';
import { AttendanceSession } from './attendance.schema';

/** One current, reusable physical NFC sticker per attendance operator. */
export const NfcTag = pgTable(
  'NfcTag',
  {
    tagId: uuid('tagId').primaryKey(),
    ownerUserId: uuid('ownerUserId')
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .notNull(),
    universityId: uuid('universityId')
      .references(() => University.UniversityID, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: varchar('tokenHash', { length: 64 }).notNull(),
    activeSessionId: uuid('activeSessionId').references(
      () => AttendanceSession.SessionID,
      { onDelete: 'set null' },
    ),
    registeredAt: timestamp('registeredAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('nfc_tag_owner_unique').on(table.ownerUserId),
    uniqueIndex('nfc_tag_token_hash_unique').on(table.tokenHash),
    index('nfc_tag_active_session_idx').on(table.activeSessionId),
  ],
);

export type NfcTagEntity = typeof NfcTag.$inferSelect;
