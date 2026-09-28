import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseSeedService } from './seeding/database-seed.service';
import { CourseSeedService } from './seeding/services/courses.seed.service';
import { ModuleSeedService } from './seeding/services/modules.seed.service';
import { UniversitySeedService } from './seeding/services/university.seed.service';
import { UserSeedService } from './seeding/services/users.seed.service';
import { SeedPersistenceService } from './seeding/seed-persistence.service';
import { AcademicCalendarSeedService } from './seeding/services/academic-calendar.seed.service';
import { PublicCalendarSeedService } from './seeding/services/public-calendar.seed.service';
import { BuildingSeedService } from './seeding/services/buildings.seed.service';
import { EventsSeedService } from './seeding/services/events.seed.service';
import { SeedQueryService } from './seeding/services/seed-query.service';
import { VenuesSeedService } from './seeding/services/venues.seed.service';
import { EventModule } from 'src/Events/event.module';

@Global()
@Module({
  imports: [EventModule],
  providers: [
    SeedPersistenceService,
    SeedQueryService,
    DatabaseService,
    DatabaseSeedService,
    CourseSeedService,
    ModuleSeedService,
    EventsSeedService,
    UniversitySeedService,
    UserSeedService,
    PublicCalendarSeedService,
    AcademicCalendarSeedService,
    BuildingSeedService,
    VenuesSeedService,
  ],
  exports: [DatabaseService, SeedPersistenceService],
})
export class DatabaseModule {}
