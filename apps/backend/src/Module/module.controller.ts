import { ModuleService } from './module.service';
import {
  AddModulesToCourseDto,
  AddModulesToCourseResponseDto,
  CreateModuleDto,
  DeleteModuleResponseDto,
  EnrollToModuleDto,
  EnrolResponseDto,
  ModuleFiltersDto,
  ModuleFiltersDtoV2,
  ModuleListResponseDto,
  ModuleListResponseDtoV2,
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
  Put,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentSession } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';
import { Roles } from '../auth/roles.guard';
import { ModuleServiceV2 } from './moduleV2.service';

@ApiTags('Modules')
@Controller('modules')
export class ModuleController {
  constructor(
    private readonly service: ModuleService,
    private readonly service2: ModuleServiceV2,
  ) {}

  //Create
  @Post()
  @Roles('lecturer', 'uni_admin')
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
  ): Promise<ModuleSingleResponseDto> {
    return this.service.create(session.user.id, dto);
  }

  //Create -V2
  @Post('v2')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Create a module - V2',
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
  createModuleV2(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateModuleDto,
  ): Promise<ModuleSingleResponseDto> {
    return this.service2.create(session.user.id, dto);
  }

  //Get all
  @Get()
  @Roles()
  @ApiOperation({
    summary: 'Get all modules with filters',
    description: `Filter by userId(enrolled) | courseId(course owned) | universityId(modules for university over all courses). At least one filter required`,
    operationId: 'getAllModules',
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
  ): Promise<ModuleListResponseDto> {
    return this.service.getAll(session.user.id, filters);
  }

  //GetAll V2
  @Get('v2/')
  @Roles()
  @ApiOperation({
    summary: 'Get all modules with filters and counts - V2',
    description: `Filter by userId(enrolled) | courseId(course owned) | universityId(modules for university over all courses). At least one filter required \n
      Enable stats response: filters: { stats=t/true/True/TRUE/1 }`,
    operationId: 'getAllModulesV2',
  })
  @ApiResponse({
    status: 200,
    description: 'Modules returned successfully',
    type: ModuleListResponseDtoV2,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid filters',
  })
  getAllV2(
    @CurrentSession() session: SessionData,
    @Query() filters: ModuleFiltersDtoV2,
  ): Promise<ModuleListResponseDtoV2> {
    return this.service2.getAll(session.user.id, filters);
  }

  //Get by id
  @Get(':moduleId')
  @Roles()
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
  ): Promise<ModuleSingleResponseDto> {
    return this.service.getById(session.user.id, moduleId);
  }

  @Get('v2/:moduleId')
  @Roles()
  @ApiOperation({
    summary: 'Get a module by ID - V2',
    description: 'Return a module from its moduleID',
    operationId: 'getModuleByIdV2',
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
  getByIdV2(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ): Promise<ModuleSingleResponseDto> {
    return this.service2.getByIdV2({
      userId: session.user.id,
      moduleId,
    });
  }

  //Update
  @Patch(':moduleId')
  @Roles('lecturer', 'uni_admin')
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
  ): Promise<ModuleSingleResponseDto> {
    return this.service.update(session.user.id, moduleId, dto);
  }

  // Delete
  @Delete(':moduleId')
  @Roles('lecturer', 'uni_admin')
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
  delete(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ): Promise<DeleteModuleResponseDto> {
    return this.service.deleteById(moduleId);
  }

  //Enrol to module
  @Get('enroll/:moduleId')
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
    description: 'Unenrolled user from module',
    type: EnrolResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  enrol(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ): Promise<EnrolResponseDto> {
    return this.service.enrollToModule(session.user.id, moduleId);
  } //END_enrol

  //Enrol to module
  @Patch('enroll/:moduleId')
  @Roles('student')
  @ApiOperation({
    summary: 'Enrol student to module - V2',
    operationId: 'enrolStudentToModuleV2',
  })
  @ApiBody({ type: EnrollToModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Student successfully enrolled student into module',
    type: EnrolResponseDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Unenrolled user from module',
    type: EnrolResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  enrolV2(
    @CurrentSession() session: SessionData,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: EnrollToModuleDto,
  ): Promise<EnrolResponseDto> {
    return this.service2.enrollToModuleV2(session.user.id, moduleId, dto);
  } //END_enrol

  //Add modules to Course
  @Put(':CourseID')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Populate Course with modules array',
    operationId: 'addModulesToCourse',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully populated modules to course',
    type: AddModulesToCourseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Modules specified in modules array not found',
  })
  addModulesToCourse(
    @Param('CourseID', ParseUUIDPipe) courseId: string,
    @Body() dto: AddModulesToCourseDto,
  ): Promise<AddModulesToCourseResponseDto> {
    return this.service.addModulesToCourse(courseId, dto);
  }

  @Post('/styling/:moduleId')
  @Roles()
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
  ): Promise<ModuleStylingResponseDto> {
    return this.service.updateStylingService(session.user.id, moduleId, dto);
  }
} //ModuleController
