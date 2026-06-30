import { UniversityService } from './university.service';

import {
  CreateUniversityDto,
  UpdateUniversityDto,
  UniversitySingleResponseDto,
  UniversityListResponseDto,
  DeleteUniversityResponseDto,
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

// import { CurrentSession } from '../auth/session.decorator';
// import type { SessionData } from '../auth/session.decorator';
import { Roles } from 'src/auth/roles.guard';

@ApiTags('Universities')
@Controller('universities')
export class UniversityController {
  constructor(private readonly service: UniversityService) {}

  //Create
  @Post()
  @Roles('uni_admin', 'sys_admin')
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
  @Roles('student', 'uni_admin', 'sys_admin')
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
  getAll() {
    return this.service.getAll();
  }

  //GetById
  @Get(':universityId')
  @Roles('student', 'uni_admin', 'sys_admin')
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
  getById(@Param('universityId', ParseUUIDPipe) universityId: string) {
    return this.service.getById(universityId);
  }

  //Update
  @Patch(':universityId')
  @Roles('uni_admin', 'sys_admin')
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
  @Roles('sys_admin') //should uni_admin's be allowed to delete - feel like a sour lecturer will be an aass and just delete his uni
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
} //UniversityController
