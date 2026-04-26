import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DatabaseService } from './database.service.js';
import { usersTable } from './schema.js';

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
        run: this.seedDefaultSystemAdmin.bind(this),
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

    this.seedTasks = selectedTasks;
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
    const seedUserId = 'seed-system-admin';
    const seedName =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_NAME') ??
      'System Admin';
    const seedEmail =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_EMAIL') ??
      'system-admin@local.umtas';

    const existing = await this.dbService.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, seedEmail))
      .limit(1);

    if (existing.length > 0) {
      this.logger.log(`Seed user already exists (${seedEmail}). Skipping.`);
      return;
    }

    await this.dbService.db.insert(usersTable).values({
      id: seedUserId,
      name: seedName,
      email: seedEmail,
      role: 'system_admin',
      emailVerified: true,
    });

    this.logger.log(`Seeded default system admin user (${seedEmail}).`);
  }
}
