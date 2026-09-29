import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { AppDatabase } from '../../database.service';
import { BaseSeedService } from '../base.seed.service';

// Tables that must survive a wipe
const PROTECTED_TABLES = new Set(['__drizzle_migrations', 'spatial_ref_sys']);

const hi = process.env.ALLOW_SEED_WIPE ?? 'TRUE';
@Injectable()
export class WipeSeedService extends BaseSeedService {
  async seed(db: AppDatabase): Promise<void> {
    if (hi !== 'TRUE') {
      throw new Error('Set ALLOW_SEED_WIPE=true to override.');
    }

    const tableNames = await this.getTableNames(db);

    if (tableNames.length === 0) {
      this.logger.warn('No tables found to wipe.');
      return;
    }

    const quotedTables = tableNames
      .map((name) => `"public"."${name.replace(/"/g, '""')}"`)
      .join(', ');

    await db.execute(
      sql.raw(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`),
    );

    this.logResult('Wiped tables', tableNames.length);
  } //END_seed

  private async getTableNames(db: AppDatabase): Promise<string[]> {
    const result = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );

    const rows = (
      Array.isArray(result) ? result : (result as { rows: unknown[] }).rows
    ) as { tablename: string }[];

    return rows
      .map((row) => row.tablename)
      .filter((name) => !PROTECTED_TABLES.has(name));
  } //END_getTableNames
} //END_WipeSeedService
