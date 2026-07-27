import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { SessionData } from '../../../src/auth/session.decorator';
import { University, usersTable, type AppUser } from '../../../src/entities';
import type * as schema from '../../../src/entities';

type FixtureDatabase = PgliteDatabase<typeof schema>;
type TestUserValues = typeof usersTable.$inferInsert;
type UniversityValues = typeof University.$inferInsert;

export async function insertTestUser(
  db: FixtureDatabase,
  values: TestUserValues,
): Promise<AppUser> {
  const [user] = await db.insert(usersTable).values(values).returning();
  return user;
}

export async function insertUniversity(
  db: FixtureDatabase,
  values: UniversityValues,
): Promise<typeof University.$inferSelect> {
  const [university] = await db.insert(University).values(values).returning();
  return university;
}

export function makeSession(user: AppUser): SessionData {
  const createdAt = user.createdAt.toISOString();
  const updatedAt = user.updatedAt.toISOString();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? undefined,
      role: user.role === 'sys_admin' ? 'sys_admin' : 'user',
      banned: user.banned,
      banReason: user.banReason ?? undefined,
      banExpires: user.banExpires?.toISOString(),
      createdAt,
      updatedAt,
    },
    session: {
      id: `integration-session-${user.id}`,
      token: `integration-token-${user.id}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt,
      updatedAt,
    },
  };
}
