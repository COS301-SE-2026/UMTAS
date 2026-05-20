import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import * as schema from './schema';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
export type AppDatabase =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

import { DB_MODES, parseDbMode, type DbMode } from './database.constants';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool?: Pool;
  readonly pglite?: PGlite;
  readonly db: AppDatabase;
  readonly dbMode: DbMode;
  private readonly logger = new Logger(DatabaseService.name);
  private readonly isTest = process.env.NODE_ENV === 'test';

  constructor(private readonly configService: ConfigService) {
    this.dbMode = parseDbMode(this.configService.get<string>('DB_MODE'));

    if (this.dbMode === DB_MODES.PGLITE) {
      this.logger.log('Initializing PGLite (In-Memory/Local)');
      this.pglite = new PGlite();
      this.db = drizzlePglite(this.pglite, { schema });
    } else {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
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

  //when testing we definitly need cleanup, otherwise jest hangs
  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }

    if (this.pglite) {
      await this.pglite.close();
    }
  }
}
