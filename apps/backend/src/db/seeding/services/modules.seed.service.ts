import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from '../../database.service';
import { eq, ilike } from 'drizzle-orm';

import crypto from 'crypto';

//Tables
import {
  Course,
  ModuleGrouping,
  modules,
  GroupModules,
  usersTable,
  ModuleStyling,
} from '../../../entities';
import { SeedPersistenceService } from '../seed-persistence.service';
import { AppDatabase } from 'src/auth/auth';
import { SeedModule } from '../Constants/Modules/Modules.constants';

@Injectable()
export class ModuleSeedService extends BaseSeedService {
  constructor(private readonly persistence: SeedPersistenceService) {
    super();
  }

  async seed(tx: DatabaseService['db']): Promise<void> {
    //cs modules
    await this.seedModulesForCourse(
      tx,
      this.constants.ALL_CS_SEED_MODULES,
      this.constants.CourseNames[0],
    );

    //as modules
    await this.seedModulesForCourse(
      tx,
      this.constants.ALL_AS_SEED_MODULES,
      this.constants.CourseNames[1],
    );

    //physiology moduels
    await this.seedModulesForCourse(
      tx,
      this.constants.ALL_PH_SEED_MODULES,
      this.constants.CourseNames[2],
    );
  } //END_seed

  private async seedModulesForCourse(
    tx: AppDatabase,
    seedModules: SeedModule[],
    courseName: string,
  ): Promise<void> {
    //Get existing modules
    const existingModules = await tx.select().from(modules);

    //All existing module codes
    const existingModuleCodes = new Set(
      existingModules.map((mod) => mod.moduleCode),
    );

    //Filter to get all missing modules
    const missingModules = seedModules.filter(
      (mod) => !existingModuleCodes.has(mod.Code),
    );

    //If there are no moduels to seed -> return
    if (missingModules.length === 0) {
      this.logResult(`[${courseName}]Modules`);
      return;
    }

    //Get course
    const [course] = await tx
      .select()
      .from(Course)
      .where(ilike(Course.CourseName, `%${courseName}%`))
      .limit(1);

    //enusre course exists
    if (!course) {
      this.logger.warn(`Course for [${courseName}] does not exist`);
      return;
    } //END_!course

    //Have to ensure course has groupID :(
    if (!course.GroupID) {
      this.logger.warn(
        `Course[${JSON.stringify(course)}] does not have a group, be better. Skipping modules seeding for ${courseName}`,
      );
      return;
    } //END_!course.GroupID

    const groupId = course.GroupID;

    //Create new modules
    const newModules = await this.persistence.insertModules(
      tx,
      missingModules.map((mod) => ({
        moduleCode: mod.Code,
        moduleName: mod.Name,
        moduleDescription: mod.Description,
        semester: this.moduleSemester(mod.SemesterOfStudy),
      })),
    );

    if (newModules.length > 0) {
      //Populate CompSci's group with modules
      const groupModules = await this.persistence.insertGroupModules(
        tx,
        newModules.map((mod) => ({
          GroupID: groupId,
          ModuleID: mod.moduleID,
        })),
      );

      this.logResult('GroupModules', groupModules?.length ?? 0);

      //Add courseModule metadata for each
      const courseModules = await this.persistence.insertCourseModules(
        tx,
        groupModules.map((gm, index) => ({
          CourseID: course.CourseID,
          GroupModuleID: gm.GroupModuleID,
          Core: missingModules[index].Core,
          SemesterOfStudy: missingModules[index].SemesterOfStudy,
          YearOfStudy: missingModules[index].YearOfStudy,
        })),
      );

      this.logResult('CourseModules', courseModules?.length ?? 0);
    } else {
      this.logger.warn(
        `Seed modules for [${courseName}] failed to insert newModules`,
      );
    } //END_if-else

    this.logResult('Modules', newModules.length);

    //Create syling enities for the new modules
    await this.generateRandomStylingForModules(
      tx,
      newModules.map((mod) => mod.moduleID),
    );

    //update hash for course's group
    //Get all modules belonging to group
    const allThaModulesIDs = await tx
      .select({ ModuleID: GroupModules.ModuleID })
      .from(GroupModules)
      .where(eq(GroupModules.GroupID, course.GroupID));

    await this.updateGroupHash(
      tx,
      course.GroupID,
      allThaModulesIDs.map((mod) => mod.ModuleID),
    );
  } //END_seedModulesForCourse

  //generate random colours for the module ID's specified
  private async generateRandomStylingForModules(
    tx: DatabaseService['db'],
    modules: string[],
  ) {
    //will generate random colours for modules for all users

    //Get all users
    const users = await tx.select().from(usersTable);

    if (users.length === 0 || modules.length === 0)
      this.logResult('ModuleStyling');

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
    const moduleStylings = await this.persistence.insertModuleStylings(
      tx,
      stylingObjects,
    );

    this.logResult('ModuleStyling', moduleStylings.length);
  } //END_generateRandomStylingForModules

  //Update hash for moduleGrouping after its been populated
  private async updateGroupHash(
    tx: DatabaseService['db'],
    groupId: string,
    modules: string[],
  ): Promise<boolean> {
    //Calculate new hash, based of modules
    const newHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(modules))
      .digest('base64');

    //update hash
    const [newGroup] = await tx
      .update(ModuleGrouping)
      .set({ Hash: newHash })
      .where(eq(ModuleGrouping.GroupID, groupId))
      .returning();

    //Return wether it was a success
    return !!newGroup;
  }

  private moduleSemester(value: string): 'SEMESTER_1' | 'SEMESTER_2' | 'YEAR' {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes('1')) return 'SEMESTER_1';
    if (normalized.includes('2')) return 'SEMESTER_2';
    return 'YEAR';
  }
} //ModuleSeedService
