import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  integer,
  bigint,
  uuid,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    role: text('role').notNull().default('student'),
    banned: boolean('banned').notNull().default(false),
    banReason: text('banReason'),
    banExpires: timestamp('banExpires', { withTimezone: true }),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailUniqueIndex: uniqueIndex('user_email_unique').on(table.email),
    roleIndex: index('user_role_idx').on(table.role),
  }),
);

export const sessionsTable = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    impersonatedBy: text('impersonatedBy'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenUniqueIndex: uniqueIndex('session_token_unique').on(table.token),
    userIdIndex: index('session_user_id_idx').on(table.userId),
    expiresAtIndex: index('session_expires_at_idx').on(table.expiresAt),
  }),
);

export const accountsTable = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    providerAccountUniqueIndex: uniqueIndex(
      'account_provider_account_unique',
    ).on(table.providerId, table.accountId),
    userIdIndex: index('account_user_id_idx').on(table.userId),
  }),
);

export const verificationsTable = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    identifierIndex: index('verification_identifier_idx').on(table.identifier),
    expiresAtIndex: index('verification_expires_at_idx').on(table.expiresAt),
  }),
);

export const rateLimitTable = pgTable(
  'rateLimit',
  {
    id: text('id').primaryKey(),
    key: text('key').notNull(),
    count: integer('count').notNull(),
    lastRequest: bigint('lastRequest', { mode: 'number' }).notNull(),
  },
  (table) => ({
    keyUniqueIndex: uniqueIndex('rate_limit_key_unique').on(table.key),
  }),
);

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
  accounts: many(accountsTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));

export type AppUser = typeof usersTable.$inferSelect;
