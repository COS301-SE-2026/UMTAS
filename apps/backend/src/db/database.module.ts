import { Global, Module } from '@nestjs/common';
import { DatabaseInitService } from './database-init.service';
import { DatabaseService } from './database.service';
import { DatabaseSeedService } from './database-seed.service';

@Global()
@Module({
  providers: [DatabaseService, DatabaseInitService, DatabaseSeedService],
  exports: [DatabaseService, DatabaseSeedService],
})
export class DatabaseModule {}
