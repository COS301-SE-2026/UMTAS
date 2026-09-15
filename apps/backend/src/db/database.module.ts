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
import { PublicCalendarSeedService } from './seeding/services/public-calendar.seed.service';
import { BuildingSeedService } from './seeding/services/buildings.seed.service';
import { EventsSeedService } from './seeding/services/events.seed.service';
import { SeedQueryService } from './seeding/services/seed-query.service';

@Global()
@Module({
  providers: [
    SeedPersistenceService,
    SeedQueryService,
    DatabaseService,
    DatabaseSeedService,
    CourseSeedService,
    ModuleSeedService,
    EventsSeedService,
    UniversitySeedService,
    UniRolesSeedService,
    UserSeedService,
    PublicCalendarSeedService,
    AcademicCalendarSeedService,
    BuildingSeedService,
  ],
  exports: [DatabaseService, SeedPersistenceService],
})
export class DatabaseModule {}
