import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { BuildingService } from './building.service';
import { Roles } from 'src/auth/roles.guard';
import {
  BuildingListResponseDto,
  BuildingQueryDto,
  BuildingSingleResponseDto,
  CreateBuildingDto,
} from './dto/building.dto';
import { CurrentSession, type SessionData } from 'src/auth/session.decorator';

@ApiTags('Buildings')
@ApiSecurity('umtas-session')
@Controller('buildings')
export class BuildingController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get()
  @Roles('student')
  @ApiOperation({
    summary: 'Get all buildings',
    description: 'Get all buildings from current selected uni',
  })
  @ApiOkResponse({
    description: 'Buildings returned successfully',
    type: BuildingListResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No uni selected or no role at uni',
  })
  getAllBuildings(
    @CurrentSession() session: SessionData,
    @Query() query: BuildingQueryDto,
  ): Promise<BuildingListResponseDto> {
    return this.buildingService.getAllBuildings(session, query);
  }

  @Post()
  @Roles('uni_admin')
  @ApiOperation({ summary: 'Create a building as uni admin' })
  @ApiCreatedResponse({
    description: 'Building created successfully',
    type: BuildingSingleResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Incorrect role permissions' })
  @ApiConflictResponse({
    description: 'Building with this name already exists',
  })
  createBuilding(
    @CurrentSession() session: SessionData,
    @Body() buildingDto: CreateBuildingDto,
  ): Promise<BuildingSingleResponseDto> {
    return this.buildingService.createBuilding(session, buildingDto);
  }
}
