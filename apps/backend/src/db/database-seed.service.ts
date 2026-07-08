import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, inArray } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { DatabaseService } from './database.service';
import {
  usersTable,
  accountsTable,
  University,
  UniversityRole,
  // Course,
} from '../entities/index';
// import { AuthSeed } from './seeds/auth.seed';
import {
  UniversityNames,
  UserNames,
  UserEmails,
  UserPasswords,
  UserIDs,
  UserUniRoles,
  // CourseNames,
  // CourseDegrees,
} from './seeds/constants.seed';

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
      {
        //Universities
        name: 'Seed-Universities',
        run: () => this.seedUniversity(),
      },
      {
        //seed users
        name: 'Seed-Users-Accounts',
        run: () => this.seedUsersAccounts(),
      },
      {
        //Seed UniRoles for users
        name: 'Seed-UniRoles-For-UniversityOfPretoria',
        run: () => this.seedUniRolesForUP(),
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

  // private async seedAuthTestData(): Promise<void> {
  //   const authSeed = new AuthSeed();
  //   await authSeed.run(this.dbService);
  // }

  private async seedUniversity(): Promise<void> {
    //University names to seed
    const uniNames = UniversityNames;

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
      this.logger.log(`Seed-Universities: No new Universities to seed`);
    }
  } //END_seedUniversity

  private async seedUsersAccounts(): Promise<void> {
    const userIDs = UserIDs;
    const userNames = UserNames;
    const userEmails = UserEmails;
    const userPasswords = UserPasswords;

    //HashPasswords
    const hashedUserPasswords: string[] = await Promise.all(
      userPasswords.map((password) => hashPassword(password)),
    );

    //Seed user obects
    const userObjects = userNames.map((name, index) => ({
      id: userIDs[index],
      name: name,
      email: userEmails[index],
      role: 'user',
      emailVerified: true,
      password: hashedUserPasswords[index],
    }));

    //Get existing users
    const existingUsers = await this.dbService.db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.email, userEmails));

    const existingEmails = new Set(existingUsers.map((user) => user.email));

    //Missing user Objects
    const missingUsers = userObjects.filter(
      (user) => !existingEmails.has(user.email),
    );

    if (missingUsers.length > 0) {
      //Seed missing users
      const newUsers = await this.dbService.db
        .insert(usersTable)
        .values(
          missingUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
          })),
        )
        .returning();

      //Seed in the accounts table
      await this.dbService.db.insert(accountsTable).values(
        missingUsers.map((user, index) => ({
          id: `${user.id}-account`,
          userId: newUsers[index].id,
          accountId: newUsers[index].id,
          providerId: 'credential',
          password: user.password,
        })),
      );
    } else {
      this.logger.log(`Seed-Users: No new Users to seed`);
    }
  } //END_seedUsers

  private async seedUniRolesForUP(): Promise<void> {
    //Select University to give roles to --> University of Pretoria
    const uniName = UniversityNames[0]; //UP
    const [uni] = await this.dbService.db
      .select()
      .from(University)
      .where(eq(University.UniversityName, uniName))
      .limit(1);

    //User ID's for which to create roles at UP by their emails
    const userEmails = UserEmails;
    const users = await this.dbService.db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.email, userEmails));
    const userIDs = users.map((user) => user.id);

    const userUniRoles = UserUniRoles;
    //Create role objects that will be used
    const uniRoles = userIDs.map((id, index) => ({
      UserID: id,
      UniversityID: uni.UniversityID,
      role: userUniRoles[index],
    }));

    //Fetch existing roles for the userId's & uniId
    const existingRoles = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UniversityID, uni.UniversityID),
          inArray(UniversityRole.UserID, userIDs),
        ),
      );

    //Existing UserID's in the uniRole table
    const existingIDs = new Set(existingRoles.map((role) => role.UserID));

    //Get the missing roles from the roles object using the existing User ID's
    const missingRoles = uniRoles.filter(
      (role) => !existingIDs.has(role.UserID),
    );

    if (missingRoles.length > 0) {
      //Seed in the missingRoles
      await this.dbService.db.insert(UniversityRole).values(missingRoles);
    } else {
      this.logger.log(
        `Seed-UniRoles-For-UniversityOfPretoria: No new roles to seed for University of Pretoria`,
      );
    }
  } //END_seedUniRolesForUP

  // private async seedCoursesWithModuleGroupings(): Promise<void>{
  //   //If course exists -> grouping should exist
  //   const courseNames = CourseNames;
  //   const courseDegrees = CourseDegrees;

  //   //Get UniversityOfPta
  //   const [uni] = await this.dbService.db
  //     .select().from(University)
  //     .where(eq(University.UniversityName, UniversityNames[0])).limit(1);

  //   let courses = courseNames.map((name, index)=>({
  //     UniversityID: uni.UniversityID,
  //     CourseName: name,
  //     Degree: courseDegrees[index]
  //   }))

  //   //Get already existing courses
  //   const existingCourses = await this.dbService.db
  //     .select().from(Course)
  //     .where(and(
  //       eq(Course.UniversityID, uni.UniversityID),
  //       inArray(Course.CourseName, courseNames),
  //       inArray(Course.Degree, courseDegrees)
  //     ));

  //   //Get the missing courses from the existing CourseNames
  //   const existingCourseNames = new Set(existingCourses.map((course)=>(course.CourseName)));
  //   let missingCourses = courses.filter((course)=>!existingCourseNames.has(course.CourseName));

  //   if (missingCourses.length>0){
  //     //First create GroupID's for the courses

  //   }

  // }//END_seedCourseWithModuleGrouping
}
