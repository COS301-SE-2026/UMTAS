import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
