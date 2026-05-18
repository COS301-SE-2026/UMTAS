import { Logger } from '@nestjs/common';
import type { ISeedMigration } from './types';

export class ExampleSeed implements ISeedMigration {
  name = 'example-seed';
  private readonly logger = new Logger('ExampleSeed');

  run(): Promise<void> {
    this.logger.log('Example seed executed');
    return Promise.resolve();
  }
}
