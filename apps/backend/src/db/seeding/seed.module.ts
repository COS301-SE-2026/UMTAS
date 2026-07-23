//Module for the seeding service
import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { ConfigModule } from '@nestjs/config';

//Services
import { DatabaseSeedService } from './database-seed.service';

//SErvices
import { UniversitySeedService } from './services/university.seed.service';
import { UserSeedService } from './services/users.seed.service';
import { UniRolesSeedService } from './services/universityRoles.seed.service';
import { CourseSeedService } from './services/courses.seed.service';
import { ModuleSeedService } from './services/modules.seed.service';

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
