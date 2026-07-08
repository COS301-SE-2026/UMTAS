import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { DatabaseService } from './database.service';
import {
  usersTable,
  accountsTable,
  University,
  UniversityRole,
} from '../entities/index';
import { AuthSeed } from './seeds/auth.seed';

interface SeedTask {
  name: string;
  run: () => Promise<void>;
}

@Injectable()
export class DatabaseSeedService {
  private readonly logger = new Logger(DatabaseSeedService.name);
  private readonly seedTasks: SeedTask[];

  constructor(
    private readonly dbService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    const allSeedTasks: SeedTask[] = [
      {
        name: 'default-system-admin',
        run: () => this.seedDefaultSystemAdmin(),
      },
      // {//seed users
      //   name: 'auth-seed',
      //  run: () => this.seedAuthTestData(),
      //},
      {
        name: 'Seed-Universities',
        run: () => this.seedUniVersity(),
      },
    ];

    const requestedTasks = (this.configService.get<string>('SEED_TASKS') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (requestedTasks.length === 0) {
      this.seedTasks = allSeedTasks;
      return;
    }

    const selectedTasks = allSeedTasks.filter((task) =>
      requestedTasks.includes(task.name),
    );
    const missingTasks = requestedTasks.filter(
      (taskName) => !allSeedTasks.some((task) => task.name === taskName),
    );

    if (missingTasks.length > 0) {
      throw new Error(
        `Unknown seed task(s): ${missingTasks.join(', ')}. Available tasks: ${allSeedTasks.map((task) => task.name).join(', ')}`,
      );
    }

    if (selectedTasks.length > 0) {
      console.log('Michael i disabled this since not all seeds ran ');
    }

    this.seedTasks = allSeedTasks;
  }

  async seed(): Promise<void> {
    this.logger.log(
      `Starting database seeding (${this.seedTasks.length} task(s))...`,
    );

    try {
      for (const task of this.seedTasks) {
        this.logger.log(`Running seed task: ${task.name}`);
        await task.run();
      }

      this.logger.log('Database seeding completed.');
    } catch (error) {
      this.logger.error('Failed to seed database', error);
      throw error;
    }
  }

  private async seedDefaultSystemAdmin(): Promise<void> {
    const seedName =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_NAME') ??
      'System Admin';
    const seedEmail =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_EMAIL') ??
      'system-admin@local.umtas';
    const seedPassword =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_PASSWORD') ??
      'Admin@UMTAS2024!';

    const existing = await this.dbService.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, seedEmail))
      .limit(1);

    if (existing.length > 0) {
      this.logger.log(`Seed user already exists (${seedEmail}). Skipping.`);
      return;
    }

    const hashedPassword = await hashPassword(seedPassword);

    const [resAdmin] = await this.dbService.db
      .insert(usersTable)
      .values({
        name: seedName,
        email: seedEmail,
        role: 'sys_admin',
        emailVerified: true,
      })
      .returning();

    const seedUserId = resAdmin.id;

    await this.dbService.db.insert(accountsTable).values({
      id: `${seedUserId}-account`,
      userId: seedUserId,
      accountId: seedUserId,
      providerId: 'credential',
      password: hashedPassword,
    });

    this.logger.log(`Seeded default system admin user (${seedEmail}).`);
  }

  private async seedAuthTestData(): Promise<void> {
    const authSeed = new AuthSeed();
    await authSeed.run(this.dbService);
  }

  private async seedUniVersity(): Promise<void> {
    //University names to seed
    const uniNames: string[] = [
      'University of Pretoria',
      'North-West University',
      'University of Cape Town',
    ];

    //Get Unis that already exists
    const existingUnis = await this.dbService.db
      .select()
      .from(University)
      .where(inArray(University.UniversityName, uniNames));

    //Find missing uni names
    const existingNames = new Set(
      existingUnis.map((uni) => uni.UniversityName),
    );
    const missingNames = uniNames.filter((name) => !existingNames.has(name));

    //Seed missingNames into University table
    if (missingNames.length > 0) {
      //Seed only missing names
      const [uniSeed] = await this.dbService.db
        .insert(University)
        .values(missingNames.map((name) => ({ UniversityName: name })))
        .returning();

      //if University of pretroia had to be seeded -> seed in uni_admin for it <=================================Might remove later :)
      if (missingNames.includes(uniNames[0])) {
        const [uniAdmin] = await this.dbService.db
          .select()
          .from(usersTable)
          .where(
            eq(
              usersTable.name,
              this.configService.get<string>('SEED_SYSTEM_ADMIN_NAME') ??
                'System Admin',
            ),
          );

        await this.dbService.db.insert(UniversityRole).values({
          UniversityID: uniSeed.UniversityID,
          UserID: uniAdmin.id,
          role: 'UNIVERSITY_ADMIN',
        });
      }
    } //END_check for missing names
    else {
      this.logger.log(`Universities already seeded`);
    }
  }
}
