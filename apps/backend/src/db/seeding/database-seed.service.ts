import { Injectable, Logger } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { eq, sql } from 'drizzle-orm'; // Added 'sql' import
import { usersTable } from '../../entities';
import type { AppDatabase } from '../database.service';
import { SeedPersistenceService } from './seed-persistence.service';
import { AcademicCalendarSeedService } from './services/academic-calendar.seed.service';
import { BuildingSeedService } from './services/buildings.seed.service';
import { CourseSeedService } from './services/courses.seed.service';
import { ModuleSeedService } from './services/modules.seed.service';
import { PublicCalendarSeedService } from './services/public-calendar.seed.service';
import { UniversitySeedService } from './services/university.seed.service';
import { UniRolesSeedService } from './services/universityRoles.seed.service';
import { UserSeedService } from './services/users.seed.service';
import { VenuesSeedService } from './services/venues.seed.service';

@Injectable()
export class DatabaseSeedService {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    private readonly universitySeedService: UniversitySeedService,
    private readonly userSeedService: UserSeedService,
    private readonly universityRolesSeedService: UniRolesSeedService,
    private readonly courseSeedService: CourseSeedService,
    private readonly moduleSeedService: ModuleSeedService,
    private readonly publicCalendarSeedService: PublicCalendarSeedService,
    private readonly academicCalendarSeedService: AcademicCalendarSeedService,
    private readonly persistence: SeedPersistenceService,
    private readonly buildingSeedService: BuildingSeedService,
    private readonly venueSeedService: VenuesSeedService,
  ) {}

  async seed(db: AppDatabase): Promise<void> {
    const tasks = [
      ['COS admin', (tx: AppDatabase) => this.seedCOSAdmin(tx)],
      ['system admin', (tx: AppDatabase) => this.seedSystemAdmin(tx)],
      [
        'universities',
        (tx: AppDatabase) => this.universitySeedService.seed(tx),
      ],
      ['users', (tx: AppDatabase) => this.userSeedService.seed(tx)],
      [
        'university roles',
        (tx: AppDatabase) => this.universityRolesSeedService.seed(tx),
      ],
      ['courses', (tx: AppDatabase) => this.courseSeedService.seed(tx)],
      ['modules', (tx: AppDatabase) => this.moduleSeedService.seed(tx)],
      [
        'public calendars',
        (tx: AppDatabase) => this.publicCalendarSeedService.seed(tx),
      ],
      [
        'academic calendar',
        (tx: AppDatabase) => this.academicCalendarSeedService.seed(tx),
      ],
      ['university map', (tx: AppDatabase) => this.seedMap(tx)],
      [
        'Hatfield buildings',
        (tx: AppDatabase) => this.buildingSeedService.seed(tx),
      ],
      ['Venues', (tx: AppDatabase) => this.venueSeedService.seed(tx)],
    ] as const;

    this.logger.log(`Starting database seeding (${tasks.length} tasks)`);

    await db.transaction(async (tx: AppDatabase) => {
      for (const [name, run] of tasks) {
        this.logger.log(`Seeding ${name}`);
        await run(tx);
      }
    });

    this.logger.log('Database seeding completed');
  }

  private async seedCOSAdmin(db: AppDatabase): Promise<void> {
    const name = 'Admin301';
    const email =
      process.env.SEED_COS_ADMIN_EMAIL?.toLowerCase() ?? 'admin301@local.umtas';
    const password = process.env.SEED_COS_ADMIN_PASSWORD ?? 'Admin@UMTAS2024!';

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) return;

    const [user] = await this.persistence.insertUsers(db, [
      {
        name,
        email,
        role: 'sys_admin',
        emailVerified: true,
      },
    ]);

    await this.persistence.insertAccounts(db, [
      {
        id: `${user.id}-account`,
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: await hashPassword(password),
      },
    ]);
    this.logger.log(`Seeded COS admin ${email}`);
  }

  private async seedMap(db: AppDatabase): Promise<void> {
    const existing = await db.execute(
      sql`SELECT 1 FROM public."UniversityMapConfig" 
          WHERE "UniversityID" = (SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria') 
          LIMIT 1;`,
    );
    if (existing && existing.rows.length > 0) {
      this.logger.log('University map config already seeded, skipping.');
      return;
    }

    await db.execute(
      sql`INSERT INTO public."UniversityMapConfig" ("UniversityID", "NorthLat", "SouthLat", "EastLng", "WestLng", "DefaultZoom")
          VALUES 
            ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), -25.74800, -25.76200, 28.23800, 28.22200, 16);`,
    );

    this.logger.log('Seeded university map config');
  }

  private async seedSystemAdmin(db: AppDatabase): Promise<void> {
    const name = process.env.SEED_SYSTEM_ADMIN_NAME ?? 'System Admin';
    const email =
      process.env.SEED_SYSTEM_ADMIN_EMAIL ?? 'system-admin@local.umtas';
    const password =
      process.env.SEED_SYSTEM_ADMIN_PASSWORD ?? 'Admin@UMTAS2024!';

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) return;

    const [user] = await this.persistence.insertUsers(db, [
      {
        name,
        email,
        role: 'sys_admin',
        emailVerified: true,
      },
    ]);

    await this.persistence.insertAccounts(db, [
      {
        id: `${user.id}-account`,
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: await hashPassword(password),
      },
    ]);
    this.logger.log(`Seeded system admin ${email}`);
  }
}
