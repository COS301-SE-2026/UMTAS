import { forwardRef, Global, Module } from '@nestjs/common';
import { DatabaseInitService } from './database-init.service';
import { DatabaseService } from './database.service';
import { SeedModule } from './seeding/seed.module';

@Global()
@Module({
  imports: [forwardRef(() => SeedModule)],
  providers: [DatabaseService, DatabaseInitService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
