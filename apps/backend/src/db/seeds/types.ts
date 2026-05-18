import type { DatabaseService } from '../database.service';

export interface ISeedMigration {
  name: string;
  run: (db: DatabaseService) => Promise<void>;
}
