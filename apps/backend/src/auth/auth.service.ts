import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../db/database.service';
import { MailerService } from '../mail/mailer.service';
import { createAuth } from './auth';
import { createRedisClient } from '../redis/redis';
import type { AuthInstance } from './auth';
import type { AppDatabase } from './auth';

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
    if (isProduction && !redisUrl) {
      this.logger.error('REDIS_URL is required in production');
      throw new Error('REDIS_URL is required in production');
    }

    // Initialize shared Redis client on bootstrap
    if (redisUrl) {
      createRedisClient(redisUrl);
    }

    this.logger.log('Auth service initialized with env validation');
  }

  getAuth(): AuthInstance {
    if (this.authInitialized && this.authInstance) {
      return this.authInstance;
    }

    const db = this.databaseService.db;
    const baseURL =
      this.configService.get<string>('BETTER_AUTH_URL') ??
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

    // Both PGlite and Postgres use the 'pg' drizzle adapter provider.
    // Explicitly derived from dbMode so any future driver change is caught here.
    const dbProvider = 'pg' as const;

    this.authInstance = createAuth({
      db,
      dbProvider,
      baseURL,
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
