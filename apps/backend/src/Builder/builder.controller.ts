import { BuilderService } from './builder.service';
import { CreateBuilderModuleDto, UpdateBuilderDto } from './dto/builder.dto';
import {
  Post,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';
import { Roles } from '../auth/roles.guard';

import { ModuleSingleResponseDto, ModuleListResponseDto, UpdateModuleDto, DeleteModuleResponseDto } from 'src/Module/dto/module.dto';

@ApiTags('Builder')
@Controller('builder')
export class BuilderController {
  constructor(private readonly service: BuilderService) {}

  //Create
  @Post()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({ 
    summary: 'Create a user defined module',
    description: 'Create a new module and link to appropriate course and automatically enroll student into module'
   })
  @ApiBody({ type: CreateBuilderModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: ModuleSingleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid module payload'
  })
  @ApiResponse({
    status: 409,
    description: 'Module code already exists for course'
  })
  createModule(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateBuilderModuleDto
  ) {
    return this.service.createModule(session.user.id, dto);
  }

  //Get all
  @Get()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Get all modules a user is enrolled in with their course',
    description: 'Filter by userId(enrolled) | courseId(course owned) | universityId(modules for university over all courses). At least one filter required'
  })
  @ApiResponse({
    status: 200,
    description: 'Modules returned successfully',
    type: ModuleListResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - at least one filter required'
  })
  @ApiResponse({
    status: 404,
    description: 'No modules found matching the filters'
  })
  getAll(
    @CurrentSession() session: SessionData
  ) {
    return this.service.getAllModules(session.user.id);
  }

  //Get by id
  @Get(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Get a module by ID',
    description: 'Return a module from its moduleID',
    operationId: 'getModuleById'
  })
  @ApiResponse({
    status: 200,
    description: 'Module returned successfully',
    type: ModuleSingleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID'
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found'
  })
  getById(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string
  ) {
    return this.service.getModuleById(moduleId, session.user.id);
  }

  //Update
  @Patch(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Update a module that the student owns',
    description: 'STUDENT_OWNED so they can update any field of the module',
    operationId: 'updateModule'
  })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: ModuleSingleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update payload or module ID'
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate module code detected for course'
  })
  update(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateBuilderDto
  ) {
    return this.service.updateModule(session.user.id, moduleId, dto);
  }

  // Delete
  @Delete(':moduleId')
  @Roles('uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Delete a module by ID',
    description: 'STUDENT_OWNED so student is allowed to delete the module if they own it',
    operationId: 'deleteModule'
  })
  @ApiResponse({
    status: 200,
    description: 'Module deleted successfully',
    type: DeleteModuleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid module ID'
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found'
  })
  delete(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string
  ) {
    return this.service.deleteModule(session.user.id, moduleId);
  }
} //BuilderController
