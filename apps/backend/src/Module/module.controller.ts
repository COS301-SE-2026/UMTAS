import { ModuleService } from './module.service';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  ModuleFiltersDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
  UpdateModuleDto,
} from './dto/module.dto';
import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';
import { Roles } from '../auth/roles.guard';

@ApiTags('Modules')
@Controller('modules')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  //Create
  // @Public()
  @Post()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({ summary: 'Create a module' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: ModuleSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid module payload',
  })
  @ApiResponse({
    status: 409,
    description: 'Module code already exists',
  })
  createModule(
    @Body() dto: CreateModuleDto,
  ) {
    return this.service.create(dto);
  }

  //Get all
  // @Public()
  @Get()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Get all modules for the current user',
    operationId: 'getModules',
  })
  @ApiResponse({
    status: 200,
    description: 'Modules returned successfully',
    type: ModuleListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  getAll(
    @CurrentSession() session: SessionData,
    @Query() filters: ModuleFiltersDto
  ) {
    return this.service.getAll(filters);
  }

  //Get by id
  // @Public()
  @Get(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Get a module by ID',
    operationId: 'getModuleById',
  })
  @ApiResponse({
    status: 200,
    description: 'Module returned successfully',
    type: ModuleSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  getById(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ) {
    return this.service.getById(moduleId);
  }

  //Update
  // @Public()
  @Patch(':moduleId')
  @Roles('uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Update a module',
    operationId: 'updateModule',
  })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: ModuleSingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update payload or module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate module code detected',
  })
  update(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateModuleDto
  ) {
    return this.service.update(session.user.id, moduleId, dto);
  }

  // @Public()
  @Delete(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Delete a module by ID',
    operationId: 'deleteModule',
  })
  @ApiResponse({
    status: 200,
    description: 'Module deleted successfully',
    type: DeleteModuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  delete(
    @Param('moduleId', ParseUUIDPipe) moduleId: string
  ) {
    return this.service.deleteById(moduleId);
  }
} //ModuleController
