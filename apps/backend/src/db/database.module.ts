import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseSeedService } from './seeding/database-seed.service';
import { CourseSeedService } from './seeding/services/courses.seed.service';
import { ModuleSeedService } from './seeding/services/modules.seed.service';
import { UniversitySeedService } from './seeding/services/university.seed.service';
import { UniRolesSeedService } from './seeding/services/universityRoles.seed.service';
import { UserSeedService } from './seeding/services/users.seed.service';
import { SeedPersistenceService } from './seeding/seed-persistence.service';
import { AcademicCalendarSeedService } from './seeding/services/academic-calendar.seed.service';

@Global()
@Module({
  providers: [
    DatabaseService,
    DatabaseSeedService,
    CourseSeedService,
    ModuleSeedService,
    UniversitySeedService,
    UniRolesSeedService,
    UserSeedService,
    SeedPersistenceService,
    AcademicCalendarSeedService,
  ],
  exports: [DatabaseService, SeedPersistenceService],
})
export class DatabaseModule {}
