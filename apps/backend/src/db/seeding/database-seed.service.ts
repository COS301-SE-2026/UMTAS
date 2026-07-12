//Disclaimer: I am adding emojies for the logs, as they are easier to differentiate in the logs -> this was not AI, rahter AIdan
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { DatabaseService } from '../database.service';
import { usersTable, accountsTable } from '../../entities/index';

//Seed Services
import { UniversitySeedService } from './services/university.seed.service';
import { UserSeedService } from './services/users.seed.service';
import { UniRolesSeedService } from './services/universityRoles.seed.service';
import { CourseSeedService } from './services/courses.seed.service';
import { ModuleSeedService } from './services/modules.seed.service';

interface SeedTask {
  name: string;
  run: (tx: DatabaseService['db']) => Promise<void>;
}

@Injectable()
export class DatabaseSeedService {
  private readonly logger = new Logger(DatabaseSeedService.name);
  private readonly seedTasks: SeedTask[];

  constructor(
    private readonly dbService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly uniSeedService: UniversitySeedService,
    private readonly userSeedService: UserSeedService,
    private readonly uniRoleSeedService: UniRolesSeedService,
    private readonly courseSeedService: CourseSeedService,
    private readonly moduleSeedService: ModuleSeedService,
  ) {
    const allSeedTasks: SeedTask[] = [
      {
        name: 'default-system-admin',
        run: (tx) => this.seedDefaultSystemAdmin(tx),
      },
      {
        //Universities
        name: 'Universities',
        run: (tx) => this.uniSeedService.seed(tx),
      },
      {
        //seed users
        name: 'Users',
        run: (tx) => this.userSeedService.seed(tx),
      },
      {
        //Seed UniRoles for users
        name: 'University Roles',
        run: (tx) => this.uniRoleSeedService.seed(tx),
      },
      {
        //Seed COurses with their moduleGroupings
        name: 'Courses',
        run: (tx) => this.courseSeedService.seed(tx),
      },
      {
        //Seed modules
        name: 'Modules',
        run: (tx) => this.moduleSeedService.seed(tx),
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
  } //END_constructor

  async seed(): Promise<void> {
    this.logger.log(
      `🫛 Starting database seeding: [${this.seedTasks.length}] tasks...`,
    );

    try {
      //One transaction for all seeding tasks
      await this.dbService.db.transaction(async (tx: DatabaseService['db']) => {
        for (const task of this.seedTasks) {
          this.logger.log(`Seeding: ${task.name}`);
          await task.run(tx);
        } //END_task
      }); //END_transaction

      this.logger.log('|--- Database seeding completed ---|');
    } catch (error) {
      this.logger.error('Seeding failed: ', error);
      throw error;
    }
  }

  private async seedDefaultSystemAdmin(
    tx: DatabaseService['db'],
  ): Promise<void> {
    const seedName =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_NAME') ??
      'System Admin';
    const seedEmail =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_EMAIL') ??
      'system-admin@local.umtas';
    const seedPassword =
      this.configService.get<string>('SEED_SYSTEM_ADMIN_PASSWORD') ??
      'Admin@UMTAS2024!';

    const existing = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, seedEmail))
      .limit(1);

    if (existing.length > 0) {
      this.logger.log(
        `Default System admin already exists [${seedEmail}]. Skip👌`,
      );
      return;
    }

    const hashedPassword = await hashPassword(seedPassword);

    const [resAdmin] = await tx
      .insert(usersTable)
      .values({
        name: seedName,
        email: seedEmail,
        role: 'sys_admin',
        emailVerified: true,
      })
      .returning();

    const seedUserId = resAdmin.id;

    await tx.insert(accountsTable).values({
      id: `${seedUserId}-account`,
      userId: seedUserId,
      accountId: seedUserId,
      providerId: 'credential',
      password: hashedPassword,
    });

    this.logger.log(`Seeded default system admin user [${seedEmail}].`);
  }
} //END_DatabaseSeedService
