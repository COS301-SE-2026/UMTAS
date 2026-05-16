import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import { MailerService } from '../mail/mailer.service';
import * as appSchema from '../db/schema';
import { createAuth } from './auth';
import { createRedisClient } from '../redis/redis';
import type { AuthInstance } from './auth';

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
    // Default to port 3001 and /api/auth path for backend
    const baseURL =
      this.configService.get<string>('BETTER_AUTH_URL') ??
      'http://localhost:3001/api/auth';

    // Frontend URL for link generation. Ensure we read it from config,
    // which now includes local .env files.
    const appURL =
      this.configService.get<string>('NEXT_PUBLIC_APP_URL') ??
      this.configService
        .get<string>('BETTER_AUTH_TRUSTED_ORIGINS')
        ?.split(',')[0]
        ?.trim() ??
      'http://localhost:3000';

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
}
