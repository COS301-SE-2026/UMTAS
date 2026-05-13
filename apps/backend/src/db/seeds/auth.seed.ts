import { Logger } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { DatabaseService } from '../database.service';
import {
  usersTable,
  sessionsTable,
  accountsTable,
  verificationsTable,
} from '../../entities';
import { eq } from 'drizzle-orm';

export const TEST_PASSWORD = 'Test@UMTAS2024!';

export interface ISeedMigration {
  name: string;
  run: (db: DatabaseService) => Promise<void>;
}

/**
 * Auth seed migration for testing and local development
 * Creates users with different roles and associated sessions/accounts
 */
export class AuthSeed implements ISeedMigration {
  name = 'auth-seed';
  private readonly logger = new Logger('AuthSeed');

  // Test user IDs (use consistent IDs for reliable testing)
  private readonly testUserIds = {
    student: 'test-student-001',
    studentTwo: 'test-student-002',
    uniAdmin: 'test-uni-admin-001',
    sysAdmin: 'test-sys-admin-001',
  };

  private readonly testSessionIds = {
    studentActive: 'test-session-student-active',
    studentExpired: 'test-session-student-expired',
    uniAdminActive: 'test-session-uni-admin-active',
    sysAdminActive: 'test-session-sys-admin-active',
  };

  async run(db: DatabaseService): Promise<void> {
    try {
      // Check if seed already exists
      const existing = await db.db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, 'test.student@example.com'))
        .limit(1);

      if (existing.length > 0) {
        this.logger.log('Auth seed already exists. Skipping.');
        return;
      }

      await this.seedTestUsers(db);
      await this.seedTestSessions(db);
      await this.seedTestAccounts(db);
      await this.seedTestVerifications(db);

      this.logger.log('Auth seed completed successfully');
    } catch (error) {
      this.logger.error('Auth seed failed', error);
      throw error;
    }
  }

  private async seedTestUsers(db: DatabaseService): Promise<void> {
    const now = new Date();

    const users = [
      {
        id: this.testUserIds.student,
        name: 'Test Student',
        email: 'test.student@example.com',
        emailVerified: true,
        image: null,
        role: 'student',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.testUserIds.studentTwo,
        name: 'Another Student',
        email: 'another.student@example.com',
        emailVerified: true,
        image: null,
        role: 'student',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.testUserIds.uniAdmin,
        name: 'University Admin',
        email: 'uni.admin@example.com',
        emailVerified: true,
        image: null,
        role: 'uni_admin',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.testUserIds.sysAdmin,
        name: 'System Admin',
        email: 'sys.admin@example.com',
        emailVerified: true,
        image: null,
        role: 'sys_admin',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.db.insert(usersTable).values(users);
    this.logger.log(`Seeded ${users.length} test users`);
  }

  private async seedTestSessions(db: DatabaseService): Promise<void> {
    const now = new Date();
    const futureExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const pastExpiry = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    const sessions = [
      {
        id: this.testSessionIds.studentActive,
        userId: this.testUserIds.student,
        token: 'test-token-student-active-' + Date.now(),
        expiresAt: futureExpiry,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Client',
        impersonatedBy: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.testSessionIds.studentExpired,
        userId: this.testUserIds.studentTwo,
        token: 'test-token-student-expired-' + Date.now(),
        expiresAt: pastExpiry,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Client',
        impersonatedBy: null,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.testSessionIds.uniAdminActive,
        userId: this.testUserIds.uniAdmin,
        token: 'test-token-uni-admin-active-' + Date.now(),
        expiresAt: futureExpiry,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Client',
        impersonatedBy: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.testSessionIds.sysAdminActive,
        userId: this.testUserIds.sysAdmin,
        token: 'test-token-sys-admin-active-' + Date.now(),
        expiresAt: futureExpiry,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Client',
        impersonatedBy: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.db.insert(sessionsTable).values(sessions);
    this.logger.log(`Seeded ${sessions.length} test sessions`);
  }

  private async seedTestAccounts(db: DatabaseService): Promise<void> {
    const now = new Date();
    const hashedPassword = await hashPassword(TEST_PASSWORD);

    const accounts = [
      {
        id: 'test-account-student',
        userId: this.testUserIds.student,
        accountId: this.testUserIds.student,
        providerId: 'credential',
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'test-account-student-google',
        userId: this.testUserIds.student,
        accountId: 'google-123456789',
        providerId: 'google',
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: 'openid email profile',
        password: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'test-account-uni-admin',
        userId: this.testUserIds.uniAdmin,
        accountId: this.testUserIds.uniAdmin,
        providerId: 'credential',
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'test-account-sys-admin',
        userId: this.testUserIds.sysAdmin,
        accountId: this.testUserIds.sysAdmin,
        providerId: 'credential',
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.db.insert(accountsTable).values(accounts);
    this.logger.log(`Seeded ${accounts.length} test accounts`);
  }

  private async seedTestVerifications(db: DatabaseService): Promise<void> {
    const now = new Date();
    const futureExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const pastExpiry = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

    const verifications = [
      {
        id: 'test-verification-valid',
        identifier: 'test.student@example.com',
        value: 'mock-verification-code-valid-' + Date.now(),
        expiresAt: futureExpiry,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'test-verification-expired',
        identifier: 'another.student@example.com',
        value: 'mock-verification-code-expired-' + Date.now(),
        expiresAt: pastExpiry,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ];

    await db.db.insert(verificationsTable).values(verifications);
    this.logger.log(`Seeded ${verifications.length} test verifications`);
  }
}

// Export test user/session IDs for use in tests
export const TEST_AUTH_DATA = {
  users: {
    student: {
      id: 'test-student-001',
      email: 'test.student@example.com',
      name: 'Test Student',
      role: 'student',
    },
    studentTwo: {
      id: 'test-student-002',
      email: 'another.student@example.com',
      name: 'Another Student',
      role: 'student',
    },
    uniAdmin: {
      id: 'test-uni-admin-001',
      email: 'uni.admin@example.com',
      name: 'University Admin',
      role: 'uni_admin',
    },
    sysAdmin: {
      id: 'test-sys-admin-001',
      email: 'sys.admin@example.com',
      name: 'System Admin',
      role: 'sys_admin',
    },
  },
  sessions: {
    studentActive: 'test-session-student-active',
    studentExpired: 'test-session-student-expired',
    uniAdminActive: 'test-session-uni-admin-active',
    sysAdminActive: 'test-session-sys-admin-active',
  },
};
