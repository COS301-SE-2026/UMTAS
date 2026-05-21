import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { DatabaseService } from './database.service';
import { DatabaseSeedService } from './database-seed.service';
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { join } from 'node:path';
import { DB_MODES, parseSeedFlag } from './database.constants';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly databaseSeedService: DatabaseSeedService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const dbMode = this.databaseService.dbMode;
    const shouldSeed = parseSeedFlag(this.configService.get<string>('SEED'));
    const migrationsFolder = join(process.cwd(), 'drizzle');

    if (!shouldSeed) {
      this.logger.log('Skipping migrations and seeding (SEED not enabled)');
      return;
    }

    try {
      if (dbMode === DB_MODES.PGLITE) {
        await migratePglite(
          this.databaseService.db as unknown as PgliteDatabase<
            Record<string, unknown>
          >,
          {
            migrationsFolder,
          },
        );
      } else {
        await this.databaseService.db.execute(sql`
          CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        `);

        await migrateNodePg(
          this.databaseService.db as unknown as NodePgDatabase<
            Record<string, unknown>
          >,
          {
            migrationsFolder,
          },
        );
      }
      this.logger.log('Database migrations applied successfully');

      await this.databaseSeedService.seed();
    } catch (error) {
      this.logger.error('Failed to run database migrations', error);
      throw error;
    }
  }
}
