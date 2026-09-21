import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { AppDatabase, DatabaseService } from '../db/database.service';
import { ModuleTeaches } from '../entities';

import type {
  CreateTeachesDto,
  ModuleTeachesType,
  TeachesResponseDto,
} from './dto/teaches.dto';
import { ModuleServiceV2 } from 'src/Module/moduleV2.service';

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
} //TeachesService
