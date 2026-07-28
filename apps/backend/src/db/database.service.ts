import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { join, resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import * as schema from '../entities/index';
import { DatabaseSeedService } from './seeding/database-seed.service';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

export type AppDatabase =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

const DB_MODES = {
  PGLITE: 'PGLITE',
  DATABASE: 'DATABASE',
} as const;

type DbMode = (typeof DB_MODES)[keyof typeof DB_MODES];

function parseDbMode(value: string | undefined): DbMode {
  const mode = value ?? DB_MODES.DATABASE;
  if (mode === DB_MODES.PGLITE || mode === DB_MODES.DATABASE) return mode;
  throw new Error(`Invalid DB_MODE: ${mode}`);
}

@Injectable()
export class DatabaseService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  readonly pool?: Pool;
  readonly pglite?: PGlite;
  readonly db: AppDatabase;
  readonly dbMode: DbMode;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Optional() private readonly seedService?: DatabaseSeedService) {
    this.dbMode = parseDbMode(process.env.DB_MODE);

    if (this.dbMode === DB_MODES.PGLITE) {
      this.logger.log('Initializing PGLite (In-Memory/Local)');
      this.pglite = new PGlite();
      this.db = drizzlePglite(this.pglite, { schema });
    } else {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is required when DB_MODE=DATABASE');
      }

      this.logger.log('Initializing Node-Postgres Pool');
      this.pool = new Pool({
        connectionString: databaseUrl,
      });
      this.db = drizzleNodePg(this.pool, { schema });
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.migrate();
      this.logger.log('Database migrations applied successfully');

      if (process.env.SEED === 'TRUE') {
        await this.seedService?.seed(this.db);
      }
    } catch (error) {
      this.logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }

    if (this.pglite) {
      await this.pglite.close();
    }
  }

  private async migrate(): Promise<void> {
    const configuredMigrationsPath = process.env.MIGRATIONS_PATH;
    const migrationsFolder = configuredMigrationsPath
      ? resolve(configuredMigrationsPath)
      : join(process.cwd(), 'drizzle');

    if (this.dbMode === DB_MODES.PGLITE) {
      await migratePglite(this.db as PgliteDatabase<Record<string, unknown>>, {
        migrationsFolder,
      });
      return;
    }

    await this.db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);
    await migrateNodePg(this.db as NodePgDatabase<Record<string, unknown>>, {
      migrationsFolder,
    });
  }
}
