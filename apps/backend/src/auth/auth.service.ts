import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../db/database.service.js';
import { createAuth } from './auth.js';
import type { AuthInstance } from './auth.js';
import type { AppDatabase } from './auth.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private authInstance: AuthInstance | null = null;
  private authInitialized = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const secret = this.configService.get<string>('BETTER_AUTH_SECRET');
    if (!secret) {
      this.logger.error('BETTER_AUTH_SECRET is required');
      throw new Error('BETTER_AUTH_SECRET is required');
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

    this.authInstance = createAuth({
      db,
      baseURL,
      secret,
      trustedOrigins,
      googleClientId,
      googleClientSecret,
      systemAdminUserIds,
      isProduction,
      redisUrl,
      logger: this.logger,
      sendResetPasswordEmail: async ({ email, url }) => {
        this.logger.log(`Password reset requested for ${email}: ${url}`);
        // TODO: integrate Resend / Nodemailer here
      },
    });
    this.authInitialized = true;

    return this.authInstance;
  }
}
