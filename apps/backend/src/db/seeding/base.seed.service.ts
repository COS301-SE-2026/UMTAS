import { Logger } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { AppDatabase } from '../database.service';
import * as constants from './Constants';

export abstract class BaseSeedService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly constants = constants;

  abstract seed(db: AppDatabase): Promise<void>;

  protected async exists<TColumn extends PgColumn>(
    db: AppDatabase,
    table: PgTable,
    column: TColumn,
    values: TColumn['_']['data'][],
  ): Promise<Set<TColumn['_']['data']>> {
    if (values.length === 0) return new Set();

    const existing = await db
      .select({ value: column })
      .from(table)
      .where(inArray(column, values));

    return new Set(existing.map((row) => row.value));
  }

  protected logResult(entity: string, count = 0): void {
    this.logger.log(
      count > 0 ? `Seeded ${count} ${entity}` : `No new ${entity} to seed`,
    );
  }
}
