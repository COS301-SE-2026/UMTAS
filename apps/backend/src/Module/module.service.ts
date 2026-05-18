import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../db/database.service';
import { modules } from '../entities/Modules/index';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';

@Injectable()
export class ModuleService {
  constructor(private readonly dbService: DatabaseService) {}

  // Create module
  async create(dto: CreateModuleDto) {
    const code = dto.code?.trim().toUpperCase();
    const name = dto.name?.trim();

    if (!code || !name)
      throw new BadRequestException('Code/Name required for module creation');

    const [existingModule] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleCode, code))
      .limit(1);

    if (existingModule)
      throw new ConflictException(`Module: ${code} already exists`);

    const [newModule] = await this.dbService.db
      .insert(modules)
      .values({
        moduleCode: code,
        moduleName: name,
        userID: dto.userId,
        styling: dto.styling,
      })
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('Module not created');

    return { module: newModule };
  } //create

  //return all
  async getAll() {
    const foundModules = await this.dbService.db.select().from(modules);

    return { modules: foundModules };
  } //getAll

  async getById(id: number) {
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, id))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return {
      module,
    };
  } //getById

  async update(moduleId: number, dto: UpdateModuleDto) {
    //Find module
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    const updatedCode = dto.code?.trim().toUpperCase();

    if (updatedCode && updatedCode !== module.moduleCode) {
      //check for module with same NEW code
      const [dupModule] = await this.dbService.db
        .select()
        .from(modules)
        .where(eq(modules.moduleCode, updatedCode))
        .limit(1);

      if (dupModule)
        throw new ConflictException('Duplicate module for new code found');
    } //duplicate module for new code

    const [newModule] = await this.dbService.db
      .update(modules)
      .set({
        moduleCode: updatedCode ?? module.moduleCode,
        moduleName: dto.name?.trim() ?? module.moduleName,
        styling: dto.styling ?? module.styling,
      })
      .where(eq(modules.moduleID, moduleId))
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('New module not created');

    return {
      module: newModule,
    };
  } //update

  async deleteById(moduleId: number) {
    const [module] = await this.dbService.db
      .select()
      .from(modules)
      .where(eq(modules.moduleID, moduleId))
      .limit(1);

    if (!module) throw new NotFoundException(`Module [${moduleId}] not found`);

    await this.dbService.db
      .delete(modules)
      .where(eq(modules.moduleID, moduleId));

    return {
      success: true,
    };
  } //delete
} //ModuleService
