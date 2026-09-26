import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { AppDatabase, DatabaseService } from '../db/database.service';
import { Course, GroupModules, ModuleTeaches } from '../entities';

import { ModuleServiceV2 } from 'src/Module/moduleV2.service';
import type {
  CreateTeachesDto,
  ModuleTeachesType,
  TeachesResponseDto,
} from './dto/teaches.dto';

@Injectable()
export class TeachesService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly moduleService: ModuleServiceV2,
  ) {}

  async assignLecturer(
    actorUserId: string,
    uniId: string,
    dto: CreateTeachesDto,
    tx?: AppDatabase,
  ): Promise<TeachesResponseDto> {
    if (!tx) {
      return this.dbService.db.transaction((t: AppDatabase) =>
        this.assignLecturer(actorUserId, uniId, dto, t),
      );
    }
    const userId = dto.UserID;
    const moduleId = dto.ModuleID;

    //Ensure module exists
    const module = await this.moduleService.getByIdV2({ moduleId, userId, tx });

    //Get existing moduleTeaches row
    const existing = await this.getExistingTeachesRelation(
      dto.ModuleID,
      userId,
      tx,
    );

    //Return early
    if (existing) {
      return {
        ...existing,
        module,
      };
    }

    //Create moduleTeaches row
    const [assignment] = await tx
      .insert(ModuleTeaches)
      .values({
        ModuleID: dto.ModuleID,
        UserID: dto.UserID,
      })
      .returning();

    if (!assignment) {
      throw new InternalServerErrorException(
        'Failed to assign lecturer to module',
      );
    }

    return {
      ...assignment,
      module,
    };
  } //END_assignLecturer

  async getLecturerModules(
    userId: string,
    uniId: string,
    tx?: AppDatabase,
  ): Promise<TeachesResponseDto[]> {
    if (!tx) {
      return this.dbService.db.transaction((t: AppDatabase) =>
        this.getLecturerModules(userId, uniId, t),
      );
    }

    //Get all moduleTeaches rows for user
    const teachesRelations = await this.getTeachesRelations(userId, uniId, tx);

    //Return early
    if (teachesRelations.length === 0) {
      return [];
    }

    //Get each module with its events
    return Promise.all(
      teachesRelations.map((relation) =>
        this.buildTeachesResponse(relation, userId, tx),
      ),
    );
  } //END_getLecturerModules

  //🎅's little helpers

  /**
   * Fetches the existing teaches relation for a module and user.
   *
   * @param moduleId - Module to look up.
   * @param userId - User to look up.
   * @param tx - Active database connection.
   * @returns The existing relation, or null if none exists.
   */
  private async getExistingTeachesRelation(
    moduleId: string,
    userId: string,
    tx: AppDatabase,
  ): Promise<ModuleTeachesType | null> {
    const [existing] = await tx
      .select()
      .from(ModuleTeaches)
      .where(
        and(
          eq(ModuleTeaches.ModuleID, moduleId),
          eq(ModuleTeaches.UserID, userId),
        ),
      )
      .limit(1);

    return existing ?? null;
  } //END_getExistingTeachesRelation

  /**
   * Fetches all teaches relations for a user.
   *
   * @param userId - User to look up.
   * @param tx - Active database transaction.
   * @returns All module teaches relations for the user.
   */
  private async getTeachesRelations(
    userId: string,
    uniId: string,
    tx: AppDatabase,
  ): Promise<ModuleTeachesType[]> {
    const teachesRelations = await tx
      .select({
        ModuleID: ModuleTeaches.ModuleID,
        UserID: ModuleTeaches.UserID,
      })
      .from(ModuleTeaches)
      .innerJoin(
        GroupModules,
        eq(GroupModules.ModuleID, ModuleTeaches.ModuleID),
      )
      .innerJoin(Course, eq(Course.GroupID, GroupModules.GroupID))
      .where(
        and(eq(ModuleTeaches.UserID, userId), eq(Course.UniversityID, uniId)),
      );

    return teachesRelations;
  } //END_getTeachesRelations

  /**
   * Builds a teaches response with the related module and events.
   *
   * @param relation - Module teaches relation.
   * @param userId - User requesting the modules.
   * @param tx - Active database transaction.
   * @returns Teaches relation with module and events.
   */
  private async buildTeachesResponse(
    relation: ModuleTeachesType,
    userId: string,
    tx: AppDatabase,
  ): Promise<TeachesResponseDto> {
    const module = await this.moduleService.getByIdV2({
      moduleId: relation.ModuleID,
      userId,
      tx,
    });

    return {
      ...relation,
      module,
    };
  } //END_buildTeachesResponse
} //TeachesService
