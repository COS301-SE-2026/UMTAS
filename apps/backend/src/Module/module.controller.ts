import { ModuleService } from './module.service';
import {
  CreateModuleDto,
  DeleteModuleResponseDto,
  EnrolResponseDto,
  ModuleFiltersDto,
  ModuleListResponseDto,
  ModuleSingleResponseDto,
  ModuleStylingBodyDto,
  ModuleStylingResponseDto,
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
  ParseUUIDPipe,
  Query,
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
  @Post()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Create a module',
    description: 'Create a new module and link to appropriate course',
  })
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
    description: 'Module code already exists for course',
  })
  createModule(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateModuleDto,
  ) {
    return this.service.create(session.user.id, dto);
  }

  //Get all
  @Get()
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Get all modules with filters',
    description:
      'Filter by userId(enrolled) | courseId(course owned) | universityId(modules for university over all courses). At least one filter required',
  })
  @ApiResponse({
    status: 200,
    description: 'Modules returned successfully',
    type: ModuleListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - at least one filter required',
  })
  @ApiResponse({
    status: 404,
    description: 'No modules found matching the filters',
  })
  getAll(
    @CurrentSession() session: SessionData,
    @Query() filters: ModuleFiltersDto,
  ) {
    return this.service.getAll(session.user.id, filters);
  }

  //Get by id
  @Get(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Get a module by ID',
    description: 'Return a module from its moduleID',
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
    return this.service.getById(session.user.id, moduleId);
  }

  //Update
  @Patch(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Update a module',
    description:
      'Update a modules | STUDENT_OWNED needs to go through Builder Service',
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
    description: 'Duplicate module code detected for course',
  })
  update(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.service.update(session.user.id, moduleId, dto);
  }

  // Delete
  @Delete(':moduleId')
  @Roles('student', 'uni_admin', 'sys_admin')
  @ApiOperation({
    summary: 'Delete a module by ID',
    description:
      'Deletes a module | STUDENT_OWNED needs to go through Builder Service',
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
  delete(@Param('moduleId', ParseUUIDPipe) moduleId: string) {
    return this.service.deleteById(moduleId);
  }

  //Enrol to module
  @Post(':moduleId')
  @Roles('student')
  @ApiOperation({
    summary: 'Enrol student to module',
    operationId: 'enrolStudentToModule',
  })
  @ApiResponse({
    status: 200,
    description: 'Student successfully enrolled student into module',
    type: EnrolResponseDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Student already enrolled into module',
    type: EnrolResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  enrol(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ) {
    return this.service.enrollToModule(session.user.id, moduleId);
  } //END_enrol

  @Post('/styling/:moduleId')
  @Roles('lecturer', 'sys_admin', 'uni_admin', 'student')
  @ApiOperation({
    summary: 'Update a module styling',
    description: 'Updates a module styling exactly for just a user',
    operationId: 'updateStyling',
  })
  @ApiBody({
    type: ModuleStylingBodyDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Module styling updated successfully',
    type: ModuleStylingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  updateStyling(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: ModuleStylingBodyDto,
  ) {
    return this.service.updateStylingService(session.user.id, moduleId, dto);
  }
} //ModuleController
