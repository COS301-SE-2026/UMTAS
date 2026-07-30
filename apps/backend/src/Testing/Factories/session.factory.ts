import { SessionData } from '../../auth/session.decorator';
import { AppRole } from '../../auth/roles';

type MockSessionOverrides = Omit<Partial<SessionData>, 'user' | 'session'> & {
  user?: Partial<SessionData['user']>;
  session?: Partial<SessionData['session']>;
};

export function createMockSession(
  userId: string,
  role: AppRole = 'user',
  overrides: MockSessionOverrides = {},
): SessionData {
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  return {
    user: {
      id: userId,
      name: 'testName',
      email: 'test@test.com',
      emailVerified: true,
      image: 'someImage',
      role,
      banned: false,
      banReason: undefined,
      banExpires: undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...overrides.user,
    },
    session: {
      id: `test-session-${userId}`,
      token: `test-token-${userId}`,
      userId,
      expiresAt,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      impersonatedBy: undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...overrides.session,
    },
    uniId: overrides.uniId,
    uniRole: overrides.uniRole,
  };
}
