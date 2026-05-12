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

    // Initialize shared Redis client on bootstrap
    const redisUrl = this.configService.get<string>('REDIS_URL');
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
        await this.mailerService.sendMail({
          to: email,
          subject: 'Reset your UMTAS password',
          html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`,
        });
      },
      sendVerificationEmail: async ({ email, url, name }) => {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Verify your UMTAS account',
          html: `<p>Hi ${name || 'User'},</p><p>Please <a href="${url}">verify your email</a> to activate your account.</p>`,
        });
      },
    });
    this.authInitialized = true;

    return this.authInstance;
  }
}
