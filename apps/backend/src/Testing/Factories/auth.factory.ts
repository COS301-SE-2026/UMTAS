import { randomUUID } from 'node:crypto';
import { accountsTable, sessionsTable } from '../../entities';

export function createAccount(
  overrides: Partial<typeof accountsTable.$inferInsert> = {},
): typeof accountsTable.$inferInsert {
  const userId = overrides.userId ?? randomUUID();
  return {
    id: `test-account-${userId}`,
    accountId: userId,
    providerId: 'credential',
    userId,
    password: 'hashed:test-password',
    ...overrides,
  };
}

export function createSessionRecord(
  overrides: Partial<typeof sessionsTable.$inferInsert> = {},
): typeof sessionsTable.$inferInsert {
  const id = overrides.id ?? `test-session-${randomUUID()}`;
  return {
    id,
    token: overrides.token ?? `test-token-${id}`,
    userId: overrides.userId ?? randomUUID(),
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    ipAddress: '127.0.0.1',
    userAgent: 'UMTAS integration test',
    ...overrides,
  };
}
