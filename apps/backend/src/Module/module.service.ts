import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
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
      .from(ModuleTable)
      .where(eq(ModuleTable.code, code))
      .limit(1);

    if (existingModule)
      throw new ConflictException(`Module: ${code} already exists`);

    const [module] = await this.dbService.db
      .insert(ModuleTable)
      .values({
        code,
        name,
        description: dto.description,
        styling: dto.styling,
        userId: dto.userId,
      })
      .returning();

    if (!module) throw new InternalServerErrorException('Module not created');

    return { module: module };
  } //create

  //return all
  async getAll() {
    const modules = await this.dbService.db.select().from(ModuleTable);

    return { modules };
  } //getAll

  async getById(id: string) {
    const [module] = await this.dbService.db
      .select()
      .from(ModuleTable)
      .where(eq(ModuleTable.id, id))
      .limit(1);

    if (!module) throw new NotFoundException('Module not found');

    return {
      module,
    };
  } //getById

  async update(moduleId: string, dto: UpdateModuleDto) {
    //Find module
    const [module] = await this.dbService.db
      .select()
      .from(ModuleTable)
      .where(eq(ModuleTable.id, moduleId))
      .limit(1);

    if (!module)
      throw new NotFoundException(`Module id[${moduleId}] not found`);

    const updatedCode = dto.code?.trim().toUpperCase();

    if (updatedCode && updatedCode !== module.code) {
      //check for module with same NEW code
      const [dupModule] = await this.dbService.db
        .from(ModuleTable)
        .where(eq(ModuleTable.code, updatedCode))
        .limit(1);

      if (dupModule)
        throw new ConflictException('Duplicate module for new code found');
    } //duplicate module for new code

    const [newModule] = this.dbService.db
      .update(ModuleTable)
      .set({
        code: updatedCode ?? module.code,
        name: dto.name ?? module.name,
        description: dto.description ?? module.description,
        styling: dto.styling ?? module.styling,
      })
      .where(eq(ModuleTable.id, moduleId))
      .returning();

    if (!newModule)
      throw new InternalServerErrorException('New module not created');

    return {
      module: newModule,
    };
  } //update

  async deleteById(moduleId: string) {
    const [module] = this.dbService.db
      .select()
      .from(ModuleTable)
      .where(eq(ModuleTable.id, moduleId))
      .limit(1);

    if (!module) throw new NotFoundException(`Module [${moduleId}] not found`);

    await this.dbService.db
      .delete(ModuleTable)
      .where(eq(ModuleTable.id, moduleId));

    return {
      success: true,
    };
  } //delete
} //ModuleService
