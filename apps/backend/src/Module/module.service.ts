import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { modules } from '../entities/Modules/index';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  ModuleListResponseDto,
  SingleModuleResponseDto,
  UpdateModuleDto,
} from './dto/module.dto';

@Injectable()
export class ModuleService {
  constructor(private readonly dbService: DatabaseService) {}

  // Create module
  async create(
    userId: string,
    dto: CreateModuleDto,
  ): Promise<SingleModuleResponseDto> {
    const code = dto.code?.trim().toUpperCase();
    const name = dto.name?.trim();
    const description = dto.description?.trim();

    if (!code || !name)
      throw new BadRequestException(
        'Code and name are required for module creation',
      );

    if (code.length > 10)
      throw new BadRequestException(
        'Module code should be shorter than 10 characters',
      );
    // if (!userId)
    //   throw new BadRequestException('User ID is required for module creation');

    const [existingModule] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleCode, code)))
      .limit(1);

    if (existingModule)
      throw new ConflictException(`Module: ${code} already exists`);

    const [newModule] = await this.dbService.db
      .insert(modules)
      .values({
        moduleCode: code,
        moduleName: name,
        moduleDescription: description,
        userID: userId,
        styling: dto.styling,
      })
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module not created');

    return { module: newModule };
  } //create

  //return all
  async getAll(userId: string): Promise<ModuleListResponseDto> {
    // if (!userId)
    //   throw new BadRequestException('User ID is required to fetch modules');

    const foundModules = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.userID, userId));

    return { modules: foundModules };
  } //getAll

  async getById(userId: string, id: number): Promise<SingleModuleResponseDto> {
    if (!userId)
      throw new BadRequestException('User ID is required to fetch a module');

    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, id)))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return {
      module,
    };
  } //getById

  async update(
    userId: string,
    moduleId: number,
    dto: UpdateModuleDto,
  ): Promise<SingleModuleResponseDto> {
    // if (!userId)
    //   throw new BadRequestException('User ID is required to update a module');

    //Find module
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    if (
      dto.code === undefined &&
      dto.name === undefined &&
      dto.description === undefined &&
      dto.styling === undefined
    ) {
      throw new BadRequestException(
        'At least one field is required to update a module',
      );
    }

    if (dto.code && dto.code.length > 10)
      throw new BadRequestException(
        'Module code should be shorter than 10 characters',
      );

    const updatedCode = dto.code?.trim().toUpperCase();
    const updatedDescription = dto.description?.trim();

    if (updatedCode && updatedCode !== module.moduleCode) {
      //check for module with same NEW code
      const [dupModule] = await this.dbService.db
        .select()
        .from(modules)
        .where(
          and(eq(modules.userID, userId), eq(modules.moduleCode, updatedCode)),
        )
        .limit(1);

      if (dupModule)
        throw new ConflictException('Duplicate module for new code found');
    } //duplicate module for new code

    const [newModule] = await this.dbService.db
      .update(modules)
      .set({
        moduleCode: updatedCode ?? module.moduleCode,
        moduleName: dto.name?.trim() ?? module.moduleName,
        moduleDescription: updatedDescription ?? module.moduleDescription,
        styling: dto.styling ?? module.styling,
      })
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)))
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module not updated');

    return {
      module: newModule,
    };
  } //update

  async deleteById(
    userId: string,
    moduleId: number,
  ): Promise<DeleteModuleResponseDto> {
    if (!userId)
      throw new BadRequestException('User ID is required to delete a module');

    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)))
      .limit(1);

    if (!module) throw new NotFoundException(`Module [${moduleId}] not found`);

    await this.dbService.db
      .delete(modules)
      .where(and(eq(modules.userID, userId), eq(modules.moduleID, moduleId)));

    return {
      success: true,
    };
  } //delete
} //ModuleService
