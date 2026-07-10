import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  forwardRef,
  Inject,
} from '@nestjs/common';

import crypto from 'crypto';

import { eq, and, ne, inArray } from 'drizzle-orm';

//Entities
import { Course, GroupModules, ModuleGrouping } from '../entities';

//Services
import { DatabaseService } from '../db/database.service';
import { CourseService } from '../Course/course.service';

import {
  CreateModuleGroupingDto,
  DeleteResponseDto,
  GroupingListResponseDto,
  GroupingSingleResponse,
  ModuleGroupingDto,
} from './dto/grouping.dto';

//Add module to group -> add module to group -> update hash for group
//remove module from group -> update hash for group
//delete group -> delete all modules in GroupModules for group -> delete group

@Injectable()
export class GroupingService {
  constructor(
    private readonly dbService: DatabaseService,
    @Inject(forwardRef(() => CourseService))
    private readonly courseService: CourseService,
  ) {}

  //Create Group -> Create a ModuleGrouping entity
  //CourseID -> check that course exists -> update course to this group
  //modules[] -> create new grouping and populate with modules -> otherwise null hash
  async createModuleGrouping(
    dto: CreateModuleGroupingDto,
  ): Promise<GroupingSingleResponse> {
    //Create new group
    let [newGroup] = await this.dbService.db
      .insert(ModuleGrouping)
      .values({})
      .returning();

    if (!newGroup)
      throw new InternalServerErrorException(`Failed to create new Group`);

    //If course provided -> see if exists -> update course to new group
    if (dto.CourseID) {
      // console.log(`GroupingService: CourseID defined`);
      //get course -> check if it exists
      const course = await this.courseService.getById(dto.CourseID);

      //Update course to new group
      await this.courseService.update(course.CourseID, {
        GroupID: newGroup.GroupID,
      });
    } //END_CourseID

    if (dto.modules) {
      //if array of moduleId's provided -> create join table entries for modules to new group
      newGroup = await this.populateGroup(newGroup.GroupID, dto.modules);
    } //END_modules

    return newGroup;
  } //END_createModuleGrouping

  //getAll groups
  async getAll(): Promise<GroupingListResponseDto> {
    const groups = await this.dbService.db
      .select({
        GroupID: ModuleGrouping.GroupID,
        Hash: ModuleGrouping.Hash,
        ModuleID: GroupModules.ModuleID,
      })
      .from(ModuleGrouping)
      .leftJoin(GroupModules, eq(GroupModules.GroupID, ModuleGrouping.GroupID));

    //Group by GroupID
    const dict: Record<string, GroupingSingleResponse> = {};

    for (const row of groups) {
      if (!dict[row.GroupID]) {
        dict[row.GroupID] = {
          GroupID: row.GroupID,
          Hash: row.Hash,
          modules: [],
        };
      } //END_New entry

      if (row.ModuleID) dict[row.GroupID].modules!.push(row.ModuleID);
    } //END_row

    //Convert into array of dto's
    return { groups: Object.values(dict) };
  } //END_getAll

  //Get group by id
  async getById(groupId: string): Promise<GroupingSingleResponse> {
    const [group] = await this.dbService.db
      .select()
      .from(ModuleGrouping)
      .where(eq(ModuleGrouping.GroupID, groupId))
      .limit(1);

    const modules = await this.dbService.db
      .select({
        ModuleID: GroupModules.ModuleID,
      })
      .from(GroupModules)
      .where(eq(GroupModules.GroupID, groupId));

    if (!group)
      throw new BadRequestException(`Group[${groupId}] does not exist`);

    return {
      ...group,
      modules: modules.map((m) => m.ModuleID),
    };
  } //END_getById

  async updateGroup(
    groupId: string,
    hash: string,
  ): Promise<GroupingSingleResponse> {
    //get old group - existance check
    const oldGroup = await this.getById(groupId);

    //If hash not new - return early
    if (hash === oldGroup.Hash) return oldGroup;

    //update hash
    await this.dbService.db
      .update(ModuleGrouping)
      .set({
        Hash: hash,
      })
      .where(eq(ModuleGrouping.GroupID, groupId))
      .returning();

    //return updated group with modules
    return await this.getById(groupId);
  } //END_updateGroup

  //Delete entire group -- database ensures GroupModule entries cascaded
  async deleteGroup(groupId: string): Promise<DeleteResponseDto> {
    const [deletedGroup] = await this.dbService.db
      .delete(ModuleGrouping)
      .where(eq(ModuleGrouping.GroupID, groupId))
      .returning();

    return {
      GroupID: deletedGroup.GroupID,
      success: !!deletedGroup,
    };
  } //END_deleteGroup

  //🎅's Little Helpers

  //Add array of modules to group -> return updated hash
  async populateGroup(
    groupId: string,
    modules: string[],
  ): Promise<GroupingSingleResponse> {
    //fetch group
    const group = await this.getById(groupId);

    const oldModules = group.modules || [];

    const newModules = modules.filter(
      (moduleId) => !oldModules.includes(moduleId),
    );

    //If no new modules to add -> return old group
    if (newModules.length === 0) return group;

    //Calculate hash
    const mergedSortedModules = [...oldModules, ...newModules].sort();
    const modulesString = JSON.stringify(mergedSortedModules);
    const newHash = crypto
      .createHash('sha256')
      .update(modulesString)
      .digest('base64');

    //Check if hash already exists -> If it already exists -> delete current group -> return matching group
    const friendHash = await this.checkForMatchingHashGroup(groupId, newHash);

    if (friendHash) {
      //Ensure all courses that made use of old group -> switch to new group
      await this.dbService.db
        .update(Course)
        .set({
          GroupID: friendHash.GroupID,
        })
        .where(eq(Course.GroupID, groupId));

      //Delete old group
      await this.deleteGroup(groupId);

      //return friend group
      return friendHash;
    } //END_friendHash
    else {
      //No duplicate hash -> populate current group with newModules
      await this.dbService.db.insert(GroupModules).values(
        newModules.map((moduleId) => ({
          GroupID: groupId,
          ModuleID: moduleId,
        })),
      );
    }

    const newGroup = await this.updateGroup(groupId, newHash);

    return newGroup;
  } //END_populateGroup

  //Friend group exists with same hash
  private async checkForMatchingHashGroup(
    currGroupId: string,
    hash: string,
  ): Promise<ModuleGroupingDto | null> {
    const [friendHash] = await this.dbService.db
      .select()
      .from(ModuleGrouping)
      .where(
        and(
          eq(ModuleGrouping.Hash, hash),
          ne(ModuleGrouping.GroupID, currGroupId),
        ),
      )
      .limit(1);

    return friendHash || null;
  } //END_checkForMatchingHashGroup

  //Remove provided modules from group
  async removeModulesFromGroup(groupId: string, modules: string[]) {
    //remove modules in array from group
    await this.dbService.db
      .delete(GroupModules)
      .where(
        and(
          eq(GroupModules.GroupID, groupId),
          inArray(GroupModules.ModuleID, modules),
        ),
      );
  } //END_removeModulesFromGroup
} //END_GroupingService
