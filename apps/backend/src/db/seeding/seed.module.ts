//Module for the seeding service
import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { ConfigModule } from '@nestjs/config';

//Services
import { DatabaseSeedService } from './database-seed.service';
import {
  CourseSeedService,
  UniversitySeedService,
  UserSeedService,
  UniRolesSeedService,
  ModuleSeedService,
} from './services';

@Module({
  imports: [forwardRef(() => DatabaseModule), ConfigModule],
  providers: [
    DatabaseSeedService,
    UniversitySeedService,
    UserSeedService,
    UniRolesSeedService,
    CourseSeedService,
    ModuleSeedService,
  ],
  exports: [DatabaseSeedService],
})
export class SeedModule {}
