import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { MailerService } from '../mail/mailer.service';
import * as appSchema from '../entities';
import { createRedisClient } from '../redis/redis';
import type { AuthInstance } from './auth';
import { DatabaseService } from '../db/database.service';
import { createAuth } from './auth';

import { UniRole } from './roles';
import { SessionData } from './session.decorator';

import { SESSION_EXAMPLE, AUTH_RESPONSE_EXAMPLE } from './auth.controller';
@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private authInstance: AuthInstance | null = null;
  private authInitialized = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailerService: MailerService,
  ) {}

  onModuleInit() {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      this.logger.error('BETTER_AUTH_SECRET is required');
      throw new Error('BETTER_AUTH_SECRET is required');
    }

    createRedisClient(process.env.REDIS_URL ?? 'redis://localhost:6379');
    this.logger.log('Auth service initialized');
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const result = await this.databaseService.db
      .select({ id: appSchema.usersTable.id })
      .from(appSchema.usersTable)
      .where(eq(appSchema.usersTable.email, email))
      .limit(1);
    return result.length > 0;
  }

  getAuth(): AuthInstance {
    if (this.authInitialized && this.authInstance) {
      return this.authInstance;
    }

    const db = this.databaseService.db;
    const baseURL =
      process.env.BETTER_AUTH_URL ?? 'http://localhost:3000/api/auth';
    const appURL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
    const secret = process.env.BETTER_AUTH_SECRET!;
    const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const systemAdminUserIds = (process.env.SYSTEM_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    const environment = process.env.NODE_ENV?.trim().toLowerCase();
    const isProduction = environment === 'production';
    const useSecureCookies = isProduction || environment === 'staging';
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

    // PGlite is PostgreSQL-compatible, so both PGlite and Postgres use the 'pg'
    // drizzle adapter provider (controls SQL dialect, not the driver).
    const dbProvider = 'pg' as const;

    this.logger.log(
      `Initializing BetterAuth with baseURL: ${baseURL} and appURL: ${appURL}`,
    );

    this.authInstance = createAuth({
      db,
      dbProvider,
      baseURL,
      appURL,
      secret,
      trustedOrigins,
      googleClientId,
      googleClientSecret,
      systemAdminUserIds,
      isProduction,
      useSecureCookies,
      redisUrl,
      logger: this.logger,
      sendResetPasswordEmail: async ({ email, url, name }) => {
        await this.mailerService.sendResetPasswordEmail({
          email,
          name: name ?? 'User',
          url,
        });
      },
      sendVerificationEmail: async ({ email, url, name }) => {
        await this.mailerService.sendVerificationEmail({
          email,
          name,
          url,
        });
      },
    });
    this.authInitialized = true;

    return this.authInstance;
  }

  async getUniversityRole(
    userId: string,
    uniId: string,
  ): Promise<UniRole | undefined> {
    //check that uni exists
    const [uni] = await this.databaseService.db
      .select()
      .from(appSchema.University)
      .where(eq(appSchema.University.UniversityID, uniId))
      .limit(1);

    if (!uni)
      throw new BadRequestException(`University[${uniId}] does not exist`);

    const [roleRow] = await this.databaseService.db
      .select()
      .from(appSchema.UniversityRole)
      .where(
        and(
          eq(appSchema.UniversityRole.UserID, userId),
          eq(appSchema.UniversityRole.UniversityID, uniId),
          ne(appSchema.UniversityRole.role, 'STUDENT_OWNED'),
        ),
      )
      .limit(1);

    if (!roleRow) return undefined;

    switch (roleRow.role) {
      case 'UNIVERSITY_ADMIN':
        return 'uni_admin';
      case 'UNIVERSITY_ADMIN_PENDING':
        return 'uni_admin_pending';
      case 'LECTURER':
        return 'lecturer';
      case 'LECTURER_PENDING':
        return 'lecturer_pending';
      case 'STUDENT':
      default:
        return 'student';
    }
  } //END_getUniversityRole

  async selectUniversity(
    session: SessionData,
    uniId: string,
  ): Promise<SessionData> {
    if (!uniId) throw new BadRequestException(`Probleempie: uniId[${uniId}]`);
    const uniRole = await this.getUniversityRole(session.user.id, uniId);

    return {
      ...session,
      uniId,
      uniRole,
    };
  } //END_selectUniversity

  async createMockUser(): Promise<typeof AUTH_RESPONSE_EXAMPLE> {
    const auth = this.getAuth();

    const email = 'testUser1@gmail.com';
    const password = 'password123';

    // Create user
    const result = await auth.api.createUser({
      body: { email, password, name: 'Simulation User', role: 'user' },
    });

    // Verify email
    await this.databaseService.db
      .update(appSchema.usersTable)
      .set({ emailVerified: true })
      .where(eq(appSchema.usersTable.id, result.user.id));

    // Sign in
    const signInResult = await auth.api.signInEmail({
      body: { email, password },
    });

    // Use the token from signInResult
    const session: typeof SESSION_EXAMPLE = {
      id: crypto.randomUUID(), // session ID
      token: signInResult.token,
      userId: result.user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Simulation Script',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        emailVerified: true,
        image: null,
        role: result.user.role || 'user',
        banned: result.user.banned ?? false,
        createdAt:
          result.user.createdAt instanceof Date
            ? result.user.createdAt.toISOString()
            : String(result.user.createdAt),
        updatedAt:
          result.user.updatedAt instanceof Date
            ? result.user.updatedAt.toISOString()
            : String(result.user.updatedAt),
      },
      session,
    };
  }
}
