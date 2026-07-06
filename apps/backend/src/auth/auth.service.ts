import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, ne } from 'drizzle-orm';
import { MailerService } from '../mail/mailer.service';
import * as appSchema from '../db/schema';
import { createRedisClient } from '../redis/redis';
import type { AuthInstance } from './auth';
import { DatabaseService } from '../db/database.service';
import { createAuth } from './auth';

import { UniRole } from './roles';
import { SessionData } from './session.decorator';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private authInstance: AuthInstance | null = null;
  private authInitialized = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  onModuleInit() {
    const secret = this.configService.get<string>('BETTER_AUTH_SECRET');
    if (!secret) {
      this.logger.error('BETTER_AUTH_SECRET is required');
      throw new Error('BETTER_AUTH_SECRET is required');
    }

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      if (isProduction) {
        this.logger.error('REDIS_URL is required in production');
        throw new Error('REDIS_URL is required in production');
      }
      this.logger.warn(
        'REDIS_URL not set. Rate limiting will use in-memory fallback (dev only).',
      );
    }

    // Initialize shared Redis client on bootstrap
    if (redisUrl) {
      createRedisClient(redisUrl);
    }

    this.logger.log('Auth service initialized with env validation');
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
      this.configService.get<string>('BETTER_AUTH_URL') ??
      'http://localhost:3000/api/auth';

    // Frontend URL for link generation. Ensure we read it from config,
    // which now includes local .env files.
    const appURL =
      this.configService.get<string>('NEXT_PUBLIC_APP_URL') ??
      this.configService
        .get<string>('BETTER_AUTH_TRUSTED_ORIGINS')
        ?.split(',')[0]
        ?.trim() ??
      'http://localhost:3001';

    const secret = this.configService.get<string>('BETTER_AUTH_SECRET')!;
    const trustedOrigins = (
      this.configService.get<string>('BETTER_AUTH_TRUSTED_ORIGINS') ?? ''
    )
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const googleClientSecret = this.configService.get<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    const systemAdminUserIds = (
      this.configService.get<string>('SYSTEM_ADMIN_USER_IDS') ?? ''
    )
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const redisUrl = this.configService.get<string>('REDIS_URL');

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

  async getUniversityRole(userId: string, uniId: string): Promise<UniRole> {
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

    if (!roleRow) {
      return 'student';
    }

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
}
