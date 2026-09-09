import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm'; // Added 'sql' import
import { hashPassword } from 'better-auth/crypto';
import type { AppDatabase } from '../database.service';
import { usersTable } from '../../entities';
import { CourseSeedService } from './services/courses.seed.service';
import { ModuleSeedService } from './services/modules.seed.service';
import { UniversitySeedService } from './services/university.seed.service';
import { UniRolesSeedService } from './services/universityRoles.seed.service';
import { UserSeedService } from './services/users.seed.service';
import { SeedPersistenceService } from './seed-persistence.service';
import { AcademicCalendarSeedService } from './services/academic-calendar.seed.service';
import { PublicCalendarSeedService } from './services/public-calendar.seed.service';

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
      ['university buildings', (tx: AppDatabase) => this.seedBuildings(tx)],
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

  private async seedBuildings(db: AppDatabase): Promise<void> {
    const existing = await db.execute(
      sql`SELECT 1 FROM public."Building" 
          WHERE "UniversityID" IN (
            SELECT "UniversityID" FROM public."University" WHERE "UniversityName" IN ('University of Pretoria', 'University of Maryland')
          ) LIMIT 1;`,
    );

    if (existing && existing.rows.length > 0) {
      this.logger.log('Buildings already seeded, skipping.');
      return;
    }

    await db.execute(
      sql`INSERT INTO public."Building" ("UniversityID", "BuildingName", "Latitude", "Longitude")
          VALUES
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'Thuto Building', -25.752932877052245, 28.23145960192486),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'IT Building', -25.755334709611287, 28.232579768596462),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'Centenary/Eeufees Building', -25.75382056742293, 28.233478481562628),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'AE du Toit Auditorium', -25.752032648778318, 28.22904682574297),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'Chancellors Building', -25.754243030429393, 28.23051010413832),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'Merensky Library', -25.755122709513454, 28.23046714644736),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Pretoria'), 'Humanities Building', -25.75535702140905, 28.231503793202357),
           ((SELECT "UniversityID" FROM public."University" WHERE "UniversityName" = 'University of Maryland'), 'University Of Maryland', 38.98701000530837, -76.94241482758859);`,
    );
    this.logger.log('Seeded buildings');
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
