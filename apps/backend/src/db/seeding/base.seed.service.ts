//This will be the base ABSTRACT class from which all seeding services will inherit and implement
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { inArray } from 'drizzle-orm';

//Constants
import * as CONSTANTS from './Constants';
import { ConfigService } from '@nestjs/config';
import { PgColumn } from 'drizzle-orm/pg-core';
import { PgTable } from 'drizzle-orm/pg-core';

/**COlors to be used for logging cause I'm not allowed emojis :( */
const Colors = {
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  RESET: '\x1b[0m',
};

@Injectable()
export abstract class BaseSeedService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly constants = CONSTANTS;

  constructor(protected readonly configService: ConfigService) {}

  /**
   * Seed method that each seeding class will implement
   * @summary Abstract method to provide method that will seed one part of the database
   * @remarks Uses the transaction to ensure all seeding tasks will run on one transaction for safe rollback
   *
   * @param tx - database transaction
   */
  abstract seed(tx: DatabaseService['db']): Promise<void>;

  /**Helper to see which values provided are existing in the table column
   *
   * @remarks
   * - TValue ensures type of the returned values, can add whatever
   * - returns a set for fast membership checks
   *
   * @param tx - the transaction is passed to ensure no databaseService calls are made outside the transaction
   * @param table - Drizzles Table type - The table to look in
   * @param column - Column from actual table to look at
   * @param values - Array of values to test existance typed from TValue
   *
   * @returns Promise a set of values that exists in the table typed as Set<TValue>
   *
   * @example ```ts
   * const existing = await this.exists(modules, 'moduleID', ['id1', 'id2', ...]);
   * ```
   */
  protected async exists<TColumn extends PgColumn>(
    tx: DatabaseService['db'],
    table: PgTable,
    column: TColumn,
    values: TColumn['_']['data'][],
  ): Promise<Set<TColumn['_']['data']>> {
    const existing = await tx
      .select({ val: column })
      .from(table)
      .where(inArray(column, values));

    return new Set(existing.map((e) => e.val));
  } //END_existing

  /**Helper for logging in seeding tasks
   *
   * @summary Checks if there is a count for success log -> else it prints nothing new seeded in
   *
   * @param entity - What entity are we busy with
   * @param count - how many of the entities were seeded in
   */
  protected logResult(entity: string, count?: number): void {
    if (count && count > 0)
      this.logger.log(
        `${Colors.GREEN}Seeded: ${count}-${entity}.${Colors.RESET}`,
      );
    else
      this.logger.log(`${Colors.CYAN}No new ${entity} to seed.${Colors.RESET}`);
  } //END_logResult
} //END_BaseSeedService
