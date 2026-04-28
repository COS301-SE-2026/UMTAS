import { Global, Module } from '@nestjs/common';
import { DatabaseInitService } from './database-init.service.js';
import { DatabaseService } from './database.service.js';
import { DatabaseSeedService } from './database-seed.service.js';

@Global()
@Module({
  providers: [DatabaseService, DatabaseInitService, DatabaseSeedService],
  exports: [DatabaseService, DatabaseSeedService],
})
export class DatabaseModule {}
