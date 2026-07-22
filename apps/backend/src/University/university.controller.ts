import { UniversityService } from './university.service';

import {
  CreateUniversityDto,
  UpdateUniversityDto,
  UniversitySingleResponseDto,
  UniversityListResponseDto,
  DeleteUniversityResponseDto,
  ApplyForUniRoleDto,
  ApproveUsersRoleDto,
  ApprovedUserRoleResponse,
  GetRoleFilterDto,
  GetRolesDto,
} from './dto/university.dto';

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
import { Roles, SystemAdmin } from '../auth/roles.guard';

@ApiTags('Universities')
@Controller('universities')
export class UniversityController {
  constructor(private readonly service: UniversityService) {}

  //Create
  @Post()
  @SystemAdmin()
  @ApiOperation({ summary: 'Create a University' })
  @ApiBody({ type: CreateUniversityDto })
  @ApiResponse({
    status: 201,
    description: 'University created successfully',
    type: UniversitySingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid university payload',
  })
  @ApiResponse({
    status: 409,
    description: 'University already exists',
  })
  create(@Body() dto: CreateUniversityDto) {
    return this.service.create(dto);
  }

  //GetAll
  @Get()
  @Roles()
  @ApiOperation({
    summary: 'Get all universities',
    operationId: 'getUniversities',
  })
  @ApiResponse({
    status: 200,
    description: 'Universities returned successfully',
    type: UniversityListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No universities found',
  })
  getAll(@CurrentSession() session: SessionData) {
    return this.service.getAll(session.user.id);
  }

  //GetById
  @Get(':universityId')
  @Roles()
  @ApiOperation({
    summary: 'get a university by ID',
    operationId: 'getUniversityById',
  })
  @ApiResponse({
    status: 200,
    description: 'University returned successfully',
    type: UniversitySingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid University ID',
  })
  @ApiResponse({
    status: 404,
    description: 'University not found',
  })
  getById(
    @CurrentSession() session: SessionData,
    @Param('universityId', ParseUUIDPipe) universityId: string,
  ) {
    return this.service.getById(universityId);
  }

  //GetById
  @Get('/role/:universityId')
  @Roles()
  @ApiOperation({
    summary: 'get a users role by universityID',
    operationId: 'getUserRoleByUniID',
  })
  @ApiResponse({
    status: 200,
    description: 'Role returned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid University ID',
  })
  @ApiResponse({
    status: 404,
    description: 'University not found',
  })
  getUsersRoleByUni(
    @CurrentSession() session: SessionData,
    @Param('universityId', ParseUUIDPipe) universityId: string,
  ) {
    return this.service.getUsersRole(session.user.id, universityId);
  }

  //Update
  @Patch(':universityId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Update an university',
    operationId: 'updateUniversity',
  })
  @ApiBody({ type: UpdateUniversityDto })
  @ApiResponse({
    status: 200,
    description: 'University updated successfully',
    type: UniversitySingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invlaid update payload or universityId',
  })
  @ApiResponse({
    status: 404,
    description: 'University not found',
  })
  update(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Body() dto: UpdateUniversityDto,
  ) {
    return this.service.update(universityId, dto);
  }

  //Delete
  @Delete(':universityId')
  @SystemAdmin()
  @ApiOperation({
    summary: 'Delete university by university ID',
    operationId: 'deleteUniversity',
  })
  @ApiResponse({
    status: 200,
    description: 'University deleted successfully',
    type: DeleteUniversityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid university ID',
  })
  @ApiResponse({
    status: 404,
    description: 'University not found',
  })
  delete(@Param('universityId', ParseUUIDPipe) universityId: string) {
    return this.service.delete(universityId);
  }

  @Post('applications/:universityID')
  @Roles('uni_admin')
  @ApiBody({ type: () => GetRoleFilterDto })
  @ApiOperation({
    summary: 'Get all applications for a specific university',
    operationId: 'getAllApplications',
  })
  @ApiResponse({
    status: 409,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: GetRolesDto,
    isArray: true,
  })
  getAllApplications(
    @CurrentSession() session: SessionData,
    @Param('universityID', ParseUUIDPipe) universityId: string,
    @Body() dto: GetRoleFilterDto,
  ) {
    return this.service.getAllApplications(session.user.id, universityId, dto);
  }

  //Apply for univeristy role
  @Post('apply')
  @ApiOperation({
    summary: 'Apply for a role at a specific university',
    operationId: 'applyForUniverstiyRole',
    description:
      'Apply for a specific role at a university. Valid: STUDENT, LECTURER, UNIVERSITY_ADMIN',
  })
  @ApiBody({
    type: ApplyForUniRoleDto,
    description: 'University ID and role to apply for',
  })
  @ApiResponse({
    status: 201,
    description: 'Role application successful',
    type: UniversitySingleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or university does not exist',
  })
  @ApiResponse({
    status: 404,
    description: 'University not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has this role at the university',
  })
  applyForRole(
    @CurrentSession() session: SessionData,
    @Body() dto: ApplyForUniRoleDto,
  ) {
    return this.service.applyForUniRole(session.user.id, dto);
  }

  //Approve a users role if PENDING
  @Post('approve')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Approve a users role for a university',
    operationId: 'approveUsersRole',
    description:
      'Approve a users role at university, will only approve if role is PENDING else throws probleme',
  })
  @ApiBody({
    type: ApproveUsersRoleDto,
    description: 'University ID and User ID for user to approve',
  })
  @ApiResponse({
    status: 201,
    description: 'Role approval successful',
    type: ApprovedUserRoleResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or universityRole does not exist',
  })
  @ApiResponse({
    status: 404,
    description: 'UniversityRole not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has an approved role',
  })
  approveUserRole(@Body() dto: ApproveUsersRoleDto) {
    return this.service.approveUserRole(dto);
  }
} //UniversityController
