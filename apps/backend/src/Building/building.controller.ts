import {
  Body,
  Controller,
  Delete,
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
import {
  CurrentSession,
  CurrentUniId,
  type SessionData,
} from 'src/auth/session.decorator';
import {
  BuildingListResponseDto,
  BuildingQueryDto,
  BuildingSingleResponseDto,
  CreateBuildingDto,
  UpdateBuildingDto,
} from './dto/building.dto';
import {
  BuildingHeatmapQueryDto,
  BuildingHeatmapResponseDto,
} from './dto/heatmap.dto';

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
    @CurrentUniId() uniId: string,
    @CurrentSession() session: SessionData,
    @Body() dto: CreateBuildingDto,
  ): Promise<BuildingSingleResponseDto> {
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
    @CurrentUniId() uniId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<BuildingSingleResponseDto> {
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
    @CurrentUniId() uniId: string,
    @Query() query: BuildingQueryDto,
  ): Promise<BuildingListResponseDto> {
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
    @CurrentUniId() uniId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: UpdateBuildingDto,
  ): Promise<BuildingSingleResponseDto> {
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
  delete(
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
  ): Promise<BuildingSingleResponseDto> {
    return this.buildingService.delete(buildingId);
  } //END_delete

  @Get(':buildingId/heatmap')
  @Roles()
  @ApiOperation({
    summary: 'Get building occupancy heatmap',
    description:
      'Returns occupancy metrics for all venues assigned to a building.',
    operationId: 'getBuildingHeatmap',
  })
  @ApiOkResponse({
    description: 'Building heatmap returned successfully',
    type: BuildingHeatmapResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid heatmap query parameters',
  })
  @ApiForbiddenResponse({
    description: 'No university selected or insufficient permissions',
  })
  @ApiNotFoundResponse({
    description: 'Building not found',
  })
  getHeatmap(
    @CurrentUniId() uniId: string,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Query() query: BuildingHeatmapQueryDto,
  ): Promise<BuildingHeatmapResponseDto> {
    return this.buildingService.getHeatmap(uniId, buildingId, query);
  } //END_getHeatmap
} //END_BuildingController
