import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from '../auth';
import { University } from '../Universities';

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
  ],
);

export type NfcTagEntity = typeof NfcTag.$inferSelect;
