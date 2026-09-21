import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentSession, CurrentUniId } from '../auth/session.decorator';
import type { SessionData } from '../auth/session.decorator';
import { Roles } from '../auth/roles.guard';

import {
  CreateTeachesDto,
  TeachesResponseDto,
  SelfAssignTeachesDto,
} from './dto/teaches.dto';
import { TeachesService } from './teaches.service';

@ApiTags('Teaches')
@Controller('teaches')
export class TeachesController {
  constructor(private readonly service: TeachesService) {}

  @Post()
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Assign a lecturer to a module',
    operationId: 'assignLecturer',
  })
  @ApiBody({ type: CreateTeachesDto })
  @ApiResponse({
    status: 201,
    description: 'Lecturer assigned to module successfully',
    type: TeachesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid teaches payload',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or no university selected',
  })
  @ApiResponse({
    status: 404,
    description: 'Module not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Lecturer was not assigned to module',
  })
  assignLecturer(
    @CurrentUniId() uniId: string,
    @CurrentSession() session: SessionData,
    @Body() dto: CreateTeachesDto,
  ): Promise<TeachesResponseDto> {
    return this.service.assignLecturer(session.user.id, uniId, dto);
  } //END_assignLecturer

  @Post('me/modules')
  @Roles('lecturer', 'uni_admin')
  @ApiOperation({
    summary: 'Assign the current lecturer or university admin to a module',
    operationId: 'assignMeToModule',
  })
  assignMeToModule(
    @CurrentUniId() uniId: string,
    @CurrentSession() session: SessionData,
    @Body() dto: SelfAssignTeachesDto,
  ): Promise<TeachesResponseDto> {
    return this.service.assignLecturer(session.user.id, uniId, {
      ModuleID: dto.ModuleID,
      UserID: session.user.id,
    });
  } //END_assignMeToModule

  @Get('me/modules')
  @Roles('lecturer')
  @ApiOperation({
    summary: 'Get modules taught by the current lecturer',
    operationId: 'getLecturerModules',
  })
  @ApiResponse({
    status: 200,
    description: 'Lecturer modules returned successfully',
    type: TeachesResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or no university selected',
  })
  getLecturerModules(
    @CurrentUniId() uniId: string,
    @CurrentSession() session: SessionData,
  ): Promise<TeachesResponseDto[]> {
    return this.service.getLecturerModules(session.user.id, uniId);
  } //END_getLecturerModules
} //TeachesController
