import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq, and, or } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import {
  RoleType,
  RoleTypeType,
  University,
  UniversityRole,
  usersTable,
} from '../entities';
import {
  CreateUniversityDto,
  UpdateUniversityDto,
  UniversitySingleResponseDto,
  UniversityListResponseDto,
  DeleteUniversityResponseDto,
  ApplyForUniRoleDto,
  ApprovedUserRoleResponse,
  ApproveUsersRoleDto,
  GetRolesDto,
  GetRoleFilterDto,
} from './dto/university.dto';
import { notExists } from 'drizzle-orm';

@Injectable()
export class UniversityService {
  constructor(private readonly dbService: DatabaseService) {}

  async create(dto: CreateUniversityDto): Promise<UniversitySingleResponseDto> {
    //Check if university already exists
    if (await this.checkDuplicateUniversityName(dto.UniversityName.trim()))
      throw new ConflictException(
        `University [${dto.UniversityName.trim()}] already exists`,
      );

    const [newUni] = await this.dbService.db
      .insert(University)
      .values({
        UniversityName: dto.UniversityName.trim(),
      })
      .returning();

    return newUni;
  } //Create

  //GetAll
  //Return all universities
  //Join with the universityRole to see what role the user has for the university
  async getAll(userId: string): Promise<UniversityListResponseDto> {
    const universities = await this.dbService.db
      .select({
        UniversityID: University.UniversityID,
        UniversityName: University.UniversityName,
        role: UniversityRole.role,
      })
      .from(University)
      .leftJoin(
        UniversityRole,
        and(
          eq(UniversityRole.UniversityID, University.UniversityID),
          eq(UniversityRole.UserID, userId),
        ),
      )
      .where(
        // show no universities if anyone has a rule student owned to it.
        notExists(
          this.dbService.db
            .select()
            .from(UniversityRole)
            .where(
              and(
                eq(UniversityRole.UniversityID, University.UniversityID),
                eq(UniversityRole.role, RoleType.enumValues[1]),
              ),
            ),
        ),
      );

    if (universities.length === 0)
      throw new NotFoundException('No universities found');

    return { universities };
  } //GetAll

  async getById(uniId: string): Promise<UniversitySingleResponseDto> {
    //Fetch uni by id
    const [uni] = await this.dbService.db
      .select()
      .from(University)
      .where(eq(University.UniversityID, uniId))
      .limit(1);

    if (!uni)
      throw new NotFoundException(
        `No University found for universityID: ${uniId}`,
      );

    return uni;
  } //getByID

  async update(
    uniId: string,
    dto: UpdateUniversityDto,
  ): Promise<UniversitySingleResponseDto> {
    //verify University exists
    const uni = await this.getById(uniId);

    //Verify atleast one field provided for update
    if (dto.UniversityName === undefined)
      throw new BadRequestException('At least one field required for update');

    //get updated fields
    const updatedName = dto.UniversityName?.trim();

    //check if updated name is the same || already exists on another university
    if (updatedName && updatedName !== uni.UniversityName)
      if (await this.checkDuplicateUniversityName(updatedName))
        throw new ConflictException(
          `University [${dto.UniversityName.trim()}] already exists.`,
        );

    // update university
    const [newUni] = await this.dbService.db
      .update(University)
      .set({
        UniversityName: updatedName ?? uni.UniversityName,
      })
      .where(eq(University.UniversityID, uniId))
      .returning();

    if (!newUni)
      throw new InternalServerErrorException('University not updated');

    return newUni;
  } //update

  async delete(uniId: string): Promise<DeleteUniversityResponseDto> {
    //Check if university exists
    const uni = await this.getById(uniId);
    if (!uni)
      throw new NotFoundException(
        `No University found for universityID: ${uniId}`,
      );

    //Delete university
    await this.dbService.db
      .delete(University)
      .where(eq(University.UniversityID, uniId));

    return {
      UniversityName: uni.UniversityName,
      success: true,
    };
  } //Delete

  async getUsersRole(userId: string, uniId: string) {
    const [uniRole] = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, userId),
          eq(UniversityRole.UniversityID, uniId),
        ),
      )
      .limit(1);

    if (!uniRole)
      throw new BadRequestException(
        `No role found for user[${userId}] for university[${uniId}]`,
      );

    return {
      UniversityID: uniRole.UniversityID,
      userId: uniRole.UserID,
      role: uniRole.role,
    };
  } //END_getUsersRole

  async applyForUniRole(
    userId: string,
    dto: ApplyForUniRoleDto,
  ): Promise<UniversitySingleResponseDto> {
    //Check that uni exists
    const uni = await this.getById(dto.UniversityID);

    if (!uni)
      throw new BadRequestException(
        `University[${dto.UniversityID}] does not exist`,
      );

    const uniId = uni.UniversityID;

    //Check if role given
    //No role given - default to student
    let role: RoleTypeType;
    switch (dto.role) {
      case 'UNIVERSITY_ADMIN':
        role = 'UNIVERSITY_ADMIN_PENDING';
        break;
      case 'LECTURER':
        role = 'LECTURER_PENDING';
        break;
      case 'STUDENT':
        role = 'STUDENT';
        break;
      default:
        role = 'STUDENT';
    }

    //Check current role for uni
    const [uniRole] = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, userId),
          eq(UniversityRole.UniversityID, uniId),
        ),
      )
      .limit(1);

    let newUniRole;
    if (!uniRole) {
      //User has not applied for a role previously
      [newUniRole] = await this.dbService.db
        .insert(UniversityRole)
        .values({
          UserID: userId,
          UniversityID: uniId,
          role,
        })
        .returning();
    } else {
      //If already existing role and already has that role -> return early
      if (uniRole.role === role) return { ...uni, role: uniRole.role };

      //User already has a role, apply for new role, by updating uniRole entity
      [newUniRole] = await this.dbService.db
        .update(UniversityRole)
        .set({
          role,
        })
        .where(
          and(
            eq(UniversityRole.UserID, userId),
            eq(UniversityRole.UniversityID, uniId),
          ),
        )
        .returning();
    }

    if (!newUniRole)
      throw new InternalServerErrorException(
        `Failed to apply for role[${role}]`,
      );

    return {
      ...uni,
      role: newUniRole.role,
    };
  } //END_applyForUniRole

  async approveUserRole(
    dto: ApproveUsersRoleDto,
  ): Promise<ApprovedUserRoleResponse> {
    //get role
    const [usersRole] = await this.dbService.db
      .select()
      .from(UniversityRole)
      .where(
        and(
          eq(UniversityRole.UserID, dto.userId),
          eq(UniversityRole.UniversityID, dto.UniversityID),
        ),
      )
      .limit(1);

    if (!usersRole)
      throw new BadRequestException(
        `No role found for user[${dto.userId}] for university[${dto.UniversityID}]`,
      );

    let role: RoleTypeType;
    if (dto.provdedRole === undefined || dto.provdedRole == null) {
      switch (usersRole.role) {
        case 'UNIVERSITY_ADMIN_PENDING':
          role = 'UNIVERSITY_ADMIN';
          break;
        case 'LECTURER_PENDING':
          role = 'LECTURER';
          break;
        default:
          throw new BadRequestException(
            `User[${dto.userId}] doesn't have a role to approve`,
          );
      }
    } else {
      role = dto.provdedRole;
    }

    // will have a frontend notification to show this off
    if (!dto.isApproved) {
      role = 'REJECTED';
    }

    //update role
    const [newRole] = await this.dbService.db
      .update(UniversityRole)
      .set({ role })
      .where(
        and(
          eq(UniversityRole.UserID, dto.userId),
          eq(UniversityRole.UniversityID, dto.UniversityID),
        ),
      )
      .returning();

    if (!newRole)
      throw new InternalServerErrorException(
        `Failed to udpate role for user[${dto.userId}]`,
      );

    return {
      userId: dto.userId,
      success: true,
    };
  } //approveUserRole

  async getAllApplications(
    userID: string,
    UniID: string,
    dto: GetRoleFilterDto,
  ): Promise<GetRolesDto[]> {
    // validate permision (extra check)
    const [role] = await this.dbService.db
      .select()
      .from(University)
      .innerJoin(
        UniversityRole,
        eq(UniversityRole.UniversityID, University.UniversityID),
      )
      .where(
        and(
          eq(UniversityRole.UserID, userID),
          eq(University.UniversityID, UniID),
        ),
      )
      .limit(1);

    // fail state no role || role not sys admin / uni admin

    if (
      !role ||
      !role.UniversityRole ||
      role.UniversityRole.role != 'UNIVERSITY_ADMIN'
    ) {
      throw new UnauthorizedException(
        'User does not have permission to get applications',
      );
    }

    const applications = await this.dbService.db
      .select({
        Name: usersTable.name,
        UserID: usersTable.id,
        Email: usersTable.email,
        UniversityID: UniversityRole.UniversityID,
        role: UniversityRole.role,
      })
      .from(UniversityRole)
      .innerJoin(usersTable, eq(UniversityRole.UserID, usersTable.id))
      .where(
        and(
          eq(UniversityRole.UniversityID, UniID),
          dto.pending
            ? or(
                eq(UniversityRole.role, 'LECTURER_PENDING'),
                eq(UniversityRole.role, 'UNIVERSITY_ADMIN_PENDING'),
              )
            : undefined,
        ),
      );
    return applications;
  }

  //🎅's Little Helpers

  //get a university by name
  async getByName(
    uniName: string,
  ): Promise<UniversitySingleResponseDto | null> {
    const [uni] = await this.dbService.db
      .select()
      .from(University)
      .where(eq(University.UniversityName, uniName.trim()))
      .limit(1);

    return uni;
  }

  async checkDuplicateUniversityName(uniName: string): Promise<boolean> {
    const [uni] = await this.dbService.db
      .select()
      .from(University)
      .where(eq(University.UniversityName, uniName))
      .limit(1);

    return !!uni;
  } //END_checkDuplicateUniversityName
} //UniversityService
