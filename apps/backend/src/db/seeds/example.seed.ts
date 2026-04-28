import { Logger } from '@nestjs/common';
import { DatabaseService } from '../database.service.js';

export interface ISeedMigration {
  name: string;
  run: (db: DatabaseService) => Promise<void>;
}

/**
 * Example seed migration implementation
 * Copy this pattern for new seed migrations
 */
export class ExampleSeed implements ISeedMigration {
  name = 'example-seed';
  private readonly logger = new Logger('ExampleSeed');

  async run(db: DatabaseService): Promise<void> {
    // Example seed logic - modify as needed
    // const result = await db.db.insert(table).values({...});
    this.logger.log('Example seed executed');
  }
}
