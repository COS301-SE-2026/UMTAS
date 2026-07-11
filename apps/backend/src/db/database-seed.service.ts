//Disclaimer: I am adding emojies for the logs, as they are easier to differentiate in the logs -> this was not AI, rahter AIdan
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
  Course,
  ModuleGrouping,
  modules,
  GroupModules,
  CourseModule,
  ModuleStyling,
} from '../entities/index';

//Import constants
import * as CONSTANTS from './seeds';
import crypto from 'crypto';

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
      {
        //Seed COurses with their moduleGroupings
        name: 'Seed-Courses-With-Their-Empty-ModuleGroupings',
        run: () => this.seedCoursesWithModuleGroupings(),
      },
      {
        name: 'Seed-Modules-To-Courses-With-CourseModuleData',
        run: () => this.seedModules(),
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
      this.logger.log(
        `Default System admin already exists [${seedEmail}]. Skip👌`,
      );
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

    this.logger.log(`Seeded default system admin user [${seedEmail}].`);
  }

  // private async seedAuthTestData(): Promise<void> {
  //   const authSeed = new AuthSeed();
  //   await authSeed.run(this.dbService);
  // }

  private async seedUniversity(): Promise<void> {
    //University names to seed
    const uniNames = CONSTANTS.UniversityNames;

    //Get Unis that already exists
    const existingUnis = await this.dbService.db
      .select()
      .from(University)
      .where(inArray(University.UniversityName, uniNames));

    //Find missing uni names
    const existingNames = new Set(
      existingUnis.map((uni) => uni.UniversityName.trim()),
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
      this.logger.log(`Universities: No new Universities to seed. Skip👌`);
    }
  } //END_seedUniversity

  private async seedUsersAccounts(): Promise<void> {
    const userIDs = CONSTANTS.UserIDs;
    const userNames = CONSTANTS.UserNames;
    const userEmails = CONSTANTS.UserEmails;
    const userPasswords = CONSTANTS.UserPasswords;

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
      this.logger.log(`Users: No new Users to seed. Skip👌`);
    }
  } //END_seedUsers

  private async seedUniRolesForUP(): Promise<void> {
    //Select University to give roles to --> University of Pretoria
    const uniName = CONSTANTS.UniversityNames[0]; //UP
    const [uni] = await this.dbService.db
      .select()
      .from(University)
      .where(eq(University.UniversityName, uniName))
      .limit(1);

    //User ID's for which to create roles at UP by their emails
    const userEmails = CONSTANTS.UserEmails;
    const users = await this.dbService.db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.email, userEmails));
    const userIDs = users.map((user) => user.id);

    const userUniRoles = CONSTANTS.UserUniRoles;
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
        `University Roles: No new roles to seed for ${uniName}. Skip👌`,
      );
    }
  } //END_seedUniRolesForUP

  private async seedCoursesWithModuleGroupings(): Promise<void> {
    //If course exists -> grouping should exist
    const courseNames = CONSTANTS.CourseNames;
    const courseDegrees = CONSTANTS.CourseDegrees;

    //Get UniversityOfPta
    const [uni] = await this.dbService.db
      .select()
      .from(University)
      .where(eq(University.UniversityName, CONSTANTS.UniversityNames[0]))
      .limit(1);

    const courses = courseNames.map((name, index) => ({
      UniversityID: uni.UniversityID,
      CourseName: name,
      Degree: courseDegrees[index],
    }));

    //Get already existing courses
    const existingCourses = await this.dbService.db
      .select()
      .from(Course)
      .where(
        and(
          eq(Course.UniversityID, uni.UniversityID),
          inArray(Course.CourseName, courseNames),
          inArray(Course.Degree, courseDegrees),
        ),
      );

    //Get the missing courses from the existing CourseNames
    const existingCourseNames = new Set(
      existingCourses.map((course) => course.CourseName),
    );
    const missingCourses = courses.filter(
      (course) => !existingCourseNames.has(course.CourseName),
    );

    if (missingCourses.length > 0) {
      //First create groups for the courses
      const groups = await this.dbService.db
        .insert(ModuleGrouping)
        .values(
          missingCourses.map(() => ({
            Hash: null,
          })),
        )
        .returning();

      //seed in missing courses
      await this.dbService.db.insert(Course).values(
        missingCourses.map((course, index) => ({
          ...course,
          GroupID: groups[index].GroupID,
        })),
      );
    } else {
      this.logger.log(`Courses: No new courses to seed. Skip👌`);
    }
  } //END_seedCourseWithModuleGrouping

  private async seedModules(): Promise<void> {
    await this.seedComputerScienceModules();
  } //END_seedModules

  private async seedComputerScienceModules(): Promise<void> {
    //get all modules
    const seedModules = CONSTANTS.ALL_SEED_MODULES;

    //Get all existing modules
    const existingModules = await this.dbService.db.select().from(modules);

    //All existing module codes
    const existingModuleCodes = new Set(
      existingModules.map((mod) => mod.moduleCode),
    );

    //Filter to get all missing modules
    const missingModules = seedModules.filter(
      (mod) => !existingModuleCodes.has(mod.Code),
    );

    //if there are modules to be seeded, seed them in
    if (missingModules.length > 0) {
      //Get Computer Science course
      const [course] = await this.dbService.db
        .select()
        .from(Course)
        .where(eq(Course.CourseName, CONSTANTS.CourseNames[0].trim())) //CS
        .limit(1);

      //enusre course exists
      if (!course) {
        this.logger.warn(
          `Course for [${CONSTANTS.CourseNames[0]}] does not exist`,
        );
        return;
      } //END_!course

      //Have to ensure course has groupID :(
      if (!course.GroupID) {
        this.logger.warn(
          `Course[${JSON.stringify(course)}] does not have a group, be better. Skipping modules seeding for Computer Science`,
        );
        return;
      } //END_!course.GroupID

      let newModules: (typeof modules.$inferSelect)[] = [];
      await this.dbService.db.transaction(async (t) => {
        //Create new modules
        newModules = await t
          .insert(modules)
          .values(
            missingModules.map((mod) => ({
              moduleCode: mod.Code,
              moduleName: mod.Name,
              moduleDescription: mod.Description,
            })),
          )
          .returning();

        if (newModules.length > 0) {
          //Populate CompSci's group with modules
          const groupModules = await t
            .insert(GroupModules)
            .values(
              newModules.map((mod) => ({
                GroupID: course.GroupID,
                ModuleID: mod.moduleID,
              })),
            )
            .returning();

          //Add courseModule metadata for each
          await t.insert(CourseModule).values(
            groupModules.map((gm, index) => ({
              CourseID: course.CourseID,
              GroupModuleID: gm.GroupModuleID,
              Core: missingModules[index].Core,
              SemesterOfStudy: missingModules[index].SemesterOfStudy,
              YearOfStudy: missingModules[index].YearOfStudy,
            })),
          );

          this.logger.log(
            `Seeded #[${newModules.length}] modules for [${CONSTANTS.CourseNames[0]}] to group [${course.GroupID}]`,
          );
        } else {
          this.logger.warn(
            `Seed modules for [${CONSTANTS.CourseNames[0]}] failed to insert newModules`,
          );
        } //END_if-else
      }); //END_transaction

      //Create syling enities for the new modules
      await this.generateRandomStylingForModules(
        newModules.map((mod) => mod.moduleID),
      );

      //update hash for course's group
      //Get all modules belonging to group
      const allThaModulesIDs = await this.dbService.db
        .select({ ModuleID: GroupModules.ModuleID })
        .from(GroupModules)
        .where(eq(GroupModules.GroupID, course.GroupID));

      const hashSuccess = await this.updateGroupHash(
        course.GroupID,
        allThaModulesIDs.map((mod) => mod.ModuleID),
      );

      if (hashSuccess)
        this.logger.log(`Hash update for group[${course.GroupID}] successfull`);
      else
        this.logger.warn(
          `Hash update for group [${course.GroupID}] not a success lol`,
        );
    } //END_missingModules.length check
    else {
      this.logger.log(
        `CS Modules: No new modules to be seeded for [${CONSTANTS.CourseNames[0]}]. Skip👌`,
      );
    }
  } //END_seedComputerScienceModules

  //generate random colours for the module ID's specified
  private async generateRandomStylingForModules(modules: string[]) {
    //will generate random colours for modules for all users

    //Get all users
    const users = await this.dbService.db.select().from(usersTable);

    if (users.length === 0 || modules.length === 0)
      this.logger.warn(`No users / modules to apply seeding for. skippy`);

    //Helper for random colors
    const genRandomColour = (): string => {
      const chars = '0123456789ABCDEF';
      let out = '#';

      for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * 16)];

      return out;
    }; //END_genRandomColour

    //Create styling objects
    const stylingObjects: (typeof ModuleStyling.$inferInsert)[] = [];

    for (const user of users) {
      for (const id of modules) {
        stylingObjects.push({
          ModuleID: id,
          UserID: user.id,
          styling: { colour: genRandomColour() },
        });
      } //END_id
    } //END_user

    //Insert all styling objects
    const moduleStylings = await this.dbService.db
      .insert(ModuleStyling)
      .values(stylingObjects)
      .returning();

    this.logger.log(
      `Styling entries created for [${users.length}]users | [${modules.length}]modules | [${moduleStylings.length}]Total`,
    );
  } //END_generateRandomStylingForModules

  //Update hash for moduleGrouping after its been populated
  private async updateGroupHash(
    groupId: string,
    modules: string[],
  ): Promise<boolean> {
    //Calculate new hash, based of modules
    const newHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(modules))
      .digest('base64');

    //update hash
    const [newGroup] = await this.dbService.db
      .update(ModuleGrouping)
      .set({ Hash: newHash })
      .where(eq(ModuleGrouping.GroupID, groupId))
      .returning();

    //Return wether it was a success
    return !!newGroup;
  }
} //END_DatabaseSeedService
