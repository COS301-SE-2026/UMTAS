import { SessionData } from '../../auth/session.decorator';
import { AppRole } from '../../auth/roles';

export function createMockSession(
  userId: string,
  role: AppRole = 'user',
): SessionData {
  const now = new Date().toISOString();

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
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: 'session_id',
      token: 'tokentjie',
      userId: userId,
      expiresAt: now + 100000,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      impersonatedBy: undefined,
      createdAt: now,
      updatedAt: now,
    },
  };
}
