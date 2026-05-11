import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { DatabaseService } from './database.service.js';
import { DatabaseSeedService } from './database-seed.service.js';
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { join } from 'node:path';
import { DB_MODES, parseSeedFlag } from './database.constants.js';

@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly databaseSeedService: DatabaseSeedService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return;
    }

    const dbMode = this.databaseService.dbMode;
    const shouldSeed = parseSeedFlag(this.configService.get<string>('SEED'));
    const migrationsFolder = join(process.cwd(), 'drizzle');

    try {
      if (dbMode === DB_MODES.PGLITE) {
        await migratePglite(this.databaseService.db as any, {
          migrationsFolder,
        });
      } else {
        await this.databaseService.db.execute(sql`
          CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        `);

        await migrateNodePg(this.databaseService.db as any, {
          migrationsFolder,
        });
      }
      this.logger.log('Database migrations applied successfully');

      if (shouldSeed) {
        await this.databaseSeedService.seed();
      }
    } catch (error) {
      this.logger.error('Failed to run database migrations', error);
      throw error;
    }
  }
}
