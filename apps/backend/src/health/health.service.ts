import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import { getRedisClient } from '../redis/redis';
import { MailerService } from '../mail/mailer.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailerService: MailerService,
  ) {}

  async check(): Promise<{
    status: string;
    services: Record<string, string>;
  }> {
    this.logger.log('Health check requested');
    const services: Record<string, string> = {};
    let status = 'ok';

    // 1. Database check (Essential)
    try {
      await this.databaseService.db.execute(sql`SELECT 1`);
      services.database = 'ok';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      services.database = 'error';
      status = 'error';
    }

    // 2. Redis check (Secondary)
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.ping();
        services.redis = 'ok';
      } catch (error) {
        this.logger.error('Redis health check failed', error);
        services.redis = 'error';
        if (status === 'ok') status = 'degraded';
      }
    }

    // 3. Mailer check (Secondary, production only)
    if (process.env.NODE_ENV === 'production') {
      try {
        await this.mailerService.verify();
        services.mailer = 'ok';
      } catch (error) {
        this.logger.error('Mailer health check failed', error);
        services.mailer = 'error';
        if (status === 'ok') status = 'degraded';
      }
    }

    return { status, services };
  }
}
