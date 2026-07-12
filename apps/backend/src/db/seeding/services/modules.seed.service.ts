import { Injectable } from '@nestjs/common';
import { BaseSeedService } from '../base.seed.service';

import { DatabaseService } from 'src/db/database.service';
import { eq } from 'drizzle-orm';

import crypto from 'crypto';

//Tables
import {
  Course,
  ModuleGrouping,
  modules,
  GroupModules,
  CourseModule,
  usersTable,
  ModuleStyling,
} from 'src/entities';

@Injectable()
export class ModuleSeedService extends BaseSeedService {
  async seed(tx: DatabaseService['db']): Promise<void> {
    await this.seedComputerScienceModules(tx);
  } //END_seed

  private async seedComputerScienceModules(
    tx: DatabaseService['db'],
  ): Promise<void> {
    //get all modules
    const seedModules = this.constants.ALL_SEED_MODULES;

    //Get all existing modules
    const existingModules = await tx.select().from(modules);

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
      const courseName = this.constants.CourseNames[0]; //CS

      //Get Computer Science course
      const [course] = await tx
        .select()
        .from(Course)
        .where(eq(Course.CourseName, courseName))
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
      const newModules = await tx
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
        const groupModules = await tx
          .insert(GroupModules)
          .values(
            newModules.map((mod) => ({
              GroupID: groupId,
              ModuleID: mod.moduleID,
            })),
          )
          .returning();

        this.logResult('GroupModules', groupModules?.length ?? 0);

        //Add courseModule metadata for each
        const courseModules = await tx
          .insert(CourseModule)
          .values(
            groupModules.map((gm, index) => ({
              CourseID: course.CourseID,
              GroupModuleID: gm.GroupModuleID,
              Core: missingModules[index].Core,
              SemesterOfStudy: missingModules[index].SemesterOfStudy,
              YearOfStudy: missingModules[index].YearOfStudy,
            })),
          )
          .returning();

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
    } //END_missingModules.length check
    else {
      this.logResult('Modules');
    }
  } //END_seedComputerScienceModules

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
    const moduleStylings = await tx
      .insert(ModuleStyling)
      .values(stylingObjects)
      .returning();

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
} //ModuleSeedService
