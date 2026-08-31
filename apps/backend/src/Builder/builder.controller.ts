import { BuilderService } from './builder.service';
import {
  CreateBuilderEventDto,
  CreateBuilderModuleDto,
  UpdateBuilderDto,
} from './dto/builder.dto';
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

import {
  ModuleSingleResponseDto,
  ModuleListResponseDto,
  UpdateModuleDto,
  DeleteModuleResponseDto,
} from '../Module/dto/module.dto';
import { Roles } from '../auth/roles.guard';
import { BuilderServiceV2 } from './builderV2.service';
import { EventSingleResponseDto } from 'src/Events/dto/EventDto.dto';

@ApiTags('Builder')
@Controller('builder')
export class BuilderController {
  constructor(
    private readonly service: BuilderService,
    private readonly service2: BuilderServiceV2,
  ) {}

  //Get Personal Module
  @Get('personalModule')
  @Roles()
  @ApiOperation({
    summary: 'Get personal module',
    description: 'Get the personal module that owns your personal events',
  })
  @ApiResponse({
    status: 200,
    description: 'Module fetched successfully',
    type: ModuleSingleResponseDto,
  })
  getPersonalModule(
    @CurrentSession() session: SessionData,
  ): Promise<ModuleSingleResponseDto> {
    console.log('Hallo COntorller');

    return this.service2.getPersonalModule(session.user.id);
  }

  //Create Module
  @Post()
  @Roles()
  @ApiOperation({
    summary: 'Create a user defined module',
    description:
      'Create a new module and link to appropriate course and automatically enroll student into module',
  })
  @ApiBody({ type: CreateBuilderModuleDto })
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
    @Body() dto: CreateBuilderModuleDto,
  ): Promise<ModuleSingleResponseDto> {
    return this.service.createModule(session.user.id, dto);
  }

  //Get all
  @Get()
  @Roles()
  @ApiOperation({
    summary: 'Get all modules a user is enrolled in with their course',
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
  ): Promise<ModuleListResponseDto> {
    return this.service.getAllModules(session.user.id);
  }

  //Get by id
  @Get(':moduleId')
  @Roles()
  @ApiOperation({
    summary: 'Get a module by ID',
    description: 'Return a module from its moduleID',
    operationId: 'builder-getModuleById',
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
  ): Promise<ModuleSingleResponseDto> {
    return this.service.getModuleById(session.user.id, moduleId);
  }

  //Update
  @Patch(':moduleId')
  @Roles()
  @ApiOperation({
    summary: 'Update a module that the student owns',
    description: 'STUDENT_OWNED so they can update any field of the module',
    operationId: 'builder-updateModule',
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
    @Body() dto: UpdateBuilderDto,
  ): Promise<ModuleSingleResponseDto> {
    return this.service.updateModule(session.user.id, moduleId, dto);
  }

  // Delete
  @Delete(':moduleId')
  @Roles()
  @ApiOperation({
    summary: 'Delete a module by ID',
    description:
      'STUDENT_OWNED so student is allowed to delete the module if they own it',
    operationId: 'builder-deleteModule',
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
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ): Promise<DeleteModuleResponseDto> {
    return this.service.deleteModule(session.user.id, moduleId);
  }

  // __________ Events __________

  //Create Event
  @Post(`events`)
  @Roles()
  @ApiOperation({
    summary: 'Create a user defined event',
    description: 'Create a new event, to module specified or personal module',
  })
  @ApiBody({ type: CreateBuilderEventDto })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventSingleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  createEvent(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateBuilderEventDto,
  ): Promise<EventSingleResponseDto> {
    return this.service2.createEvent(session.user.id, dto);
  }
} //BuilderController
