import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { BuildingService } from './building.service';
import { Roles } from 'src/auth/roles.guard';
import { CurrentSession, type SessionData } from 'src/auth/session.decorator';
import {
  BuildingListResponseDto,
  BuildingQueryDto,
  BuildingSingleResponseDto,
  CreateBuildingDto,
  UpdateBuildingDto,
} from './dto/building.dto';

@ApiTags('Buildings')
@ApiSecurity('umtas-session')
@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  //Create
  @Post()
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Create a building',
    description: 'Create a building for the users university.',
    operationId: 'createBuilding',
  })
  @ApiBody({ type: CreateBuildingDto })
  @ApiCreatedResponse({
    description: 'Building created successfully',
    type: BuildingSingleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid building payload' })
  @ApiConflictResponse({
    description: 'Building name already exists for this university',
  })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  create(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateBuildingDto,
  ): Promise<BuildingSingleResponseDto> {
    const uniId = session.uniId;

    if (!uniId) throw new ForbiddenException(`No university selected`);

    return this.buildingService.create({
      ...dto,
      UniversityID: uniId,
      CreatedBy: session.user.id,
    });
  } //END_create

  //GetById
  @Get(':buildingId')
  @Roles()
  @ApiOperation({
    summary: 'Get a building by ID',
    operationId: 'getBuildingById',
  })
  @ApiOkResponse({
    description: 'Building returned successfully',
    type: BuildingSingleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Building not found' })
  @ApiForbiddenResponse({ description: 'No university selected' })
  getById(
    @CurrentSession() session: SessionData,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<BuildingSingleResponseDto> {
    const uniId = session.uniId;

    if (!uniId) throw new ForbiddenException(`No university selected`);

    return this.buildingService.getById(uniId, buildingId);
  } //END_getById

  //GetAll
  @Get()
  @Roles()
  @ApiOperation({
    description: 'Get all buildings from current selected uni',
    summary: 'Get all buildings',
    operationId: 'getAllBuildings',
  })
  @ApiOkResponse({
    description: 'Buildings returned successfully',
    type: BuildingListResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No uni selected or no role at uni',
  })
  getAll(
    @CurrentSession() session: SessionData,
    @Query() query: BuildingQueryDto,
  ): Promise<BuildingListResponseDto> {
    const uniId = session.uniId;

    if (!uniId) throw new ForbiddenException(`No university selected`);

    return this.buildingService.getAll(uniId, query);
  } //END_getAll

  //Update
  @Patch(':buildingId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Update a building',
    description:
      'Update building name, location, footprint, icon, and/or colour. Only fields present in the body are updated.',
    operationId: 'updateBuilding',
  })
  @ApiBody({ type: UpdateBuildingDto })
  @ApiOkResponse({
    description: 'Building updated successfully',
    type: BuildingSingleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid update payload' })
  @ApiNotFoundResponse({ description: 'Building not found' })
  @ApiConflictResponse({
    description: 'Building name already exists for this university',
  })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  update(
    @CurrentSession() session: SessionData,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: UpdateBuildingDto,
  ): Promise<BuildingSingleResponseDto> {
    const uniId = session.uniId;

    if (!uniId) throw new ForbiddenException(`No university selected`);

    return this.buildingService.update(uniId, buildingId, dto);
  } //END_update

  //Delete
  @Delete(':buildingId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Delete a building by ID',
    operationId: 'deleteBuilding',
  })
  @ApiOkResponse({
    description: 'Building deleted successfully',
    type: BuildingSingleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Building not found' })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  delete(
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<BuildingSingleResponseDto> {
    return this.buildingService.delete(buildingId);
  } //END_delete
} //END_BuildingController
