import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../../src/db/database.service';
import {
  accountsTable,
  University,
  UniversityRole,
  usersTable,
} from '../../src/entities';

export const AUTH_E2E_PASSWORD = 'Test@UMTAS2024!';

export const AUTH_E2E_USERS = {
  student: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test.student@example.com',
    name: 'Test Student',
    role: 'user',
  },
  studentTwo: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'another.student@example.com',
    name: 'Another Student',
    role: 'user',
  },
  lecturer: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'test.lecturer@example.com',
    name: 'Test Lecturer',
    role: 'user',
  },
  uniAdmin: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'uni.admin@example.com',
    name: 'University Admin',
    role: 'user',
  },
  sysAdmin: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'sys.admin@example.com',
    name: 'System Admin',
    role: 'sys_admin',
  },
} as const;

export async function seedAuthE2eFixtures(db: AppDatabase): Promise<void> {
  const users = Object.values(AUTH_E2E_USERS);
  const password = await hashPassword(AUTH_E2E_PASSWORD);

  await db.insert(usersTable).values(
    users.map((user) => ({
      ...user,
      emailVerified: true,
    })),
  );

  await db.insert(accountsTable).values(
    users.map((user) => ({
      id: `test-account-${user.id}`,
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password,
    })),
  );

  const [university] = await db
    .select({ id: University.UniversityID })
    .from(University)
    .where(eq(University.UniversityName, 'University of Pretoria'))
    .limit(1);

  if (!university) {
    throw new Error('Auth e2e fixtures require the seeded university');
  }

  await db.insert(UniversityRole).values([
    {
      UniversityID: university.id,
      UserID: AUTH_E2E_USERS.student.id,
      role: 'STUDENT',
    },
    {
      UniversityID: university.id,
      UserID: AUTH_E2E_USERS.studentTwo.id,
      role: 'STUDENT',
    },
    {
      UniversityID: university.id,
      UserID: AUTH_E2E_USERS.lecturer.id,
      role: 'LECTURER',
    },
    {
      UniversityID: university.id,
      UserID: AUTH_E2E_USERS.uniAdmin.id,
      role: 'UNIVERSITY_ADMIN',
    },
  ]);
}
