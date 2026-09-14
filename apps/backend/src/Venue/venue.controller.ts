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
import { VenueService } from './venue.service';
import { Roles } from 'src/auth/roles.guard';
import { CurrentSession, type SessionData } from 'src/auth/session.decorator';
import {
  AssignVenueBuildingDto,
  BulkAssignResponseDto,
  BulkAssignVenuesDto,
  CreateVenueDto,
  UpdateVenueDto,
  VenueMappingDto,
  VenueMappingListResponseDto,
  VenueQueryDto,
  VenueSingleResponseDto,
} from './dto/venue.dto';

@ApiTags('Venues')
@ApiSecurity('umtas-session')
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  //Create
  @Post()
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Create a venue',
    description: 'Create a venue for the users university.',
    operationId: 'createVenue',
  })
  @ApiBody({ type: CreateVenueDto })
  @ApiCreatedResponse({
    description: 'Venue created successfully',
    type: VenueSingleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid venue payload' })
  @ApiConflictResponse({
    description: 'Venue name already exists for this university',
  })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  create(
    @CurrentSession() session: SessionData,
    @Body() dto: CreateVenueDto,
  ): Promise<VenueSingleResponseDto> {
    return this.venueService.create({
      ...dto,
      UniversityID: session.uniId!,
    });
  } //END_create

  //GetById
  @Get(':venueId')
  @Roles()
  @ApiOperation({
    summary: 'Get a venue by ID',
    operationId: 'getVenueById',
  })
  @ApiOkResponse({
    description: 'Venue returned successfully',
    type: VenueSingleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Venue not found' })
  getById(
    @Param('venueId', ParseUUIDPipe) venueId: string,
  ): Promise<VenueSingleResponseDto> {
    return this.venueService.getById(venueId);
  } //END_getById

  //GetAll
  @Get()
  @Roles('student')
  @ApiOperation({
    description: 'Get all venues from current selected uni',
    summary: 'Get all venues',
    operationId: 'getAllVenues',
  })
  @ApiOkResponse({
    description: 'Venues returned successfully',
    type: VenueMappingListResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No uni selected or no role at uni',
  })
  getAllVenues(
    @CurrentSession() session: SessionData,
    @Query() query: VenueQueryDto,
  ): Promise<VenueMappingListResponseDto> {
    return this.venueService.getAllVenues(session, query);
  } //END_getAllVenues

  //Update
  @Patch(':venueId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Update a venue',
    description:
      'Update venue name and/or building assignment. Only fields present in the body are updated.',
    operationId: 'updateVenue',
  })
  @ApiBody({ type: UpdateVenueDto })
  @ApiOkResponse({
    description: 'Venue updated successfully',
    type: VenueSingleResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid update payload' })
  @ApiNotFoundResponse({ description: 'Venue or building not found' })
  @ApiConflictResponse({
    description: 'Venue name already exists for this university',
  })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  update(
    @CurrentSession() session: SessionData,
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @Body() dto: UpdateVenueDto,
  ): Promise<VenueSingleResponseDto> {
    const uniId = session.uniId;

    if (!uniId) throw new ForbiddenException(`No university selected`);

    return this.venueService.update(venueId, {
      ...dto,
      UniversityID: uniId,
    });
  } //END_update

  //Delete
  @Delete(':venueId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Delete a venue by ID',
    operationId: 'deleteVenue',
  })
  @ApiOkResponse({
    description: 'Venue deleted successfully',
    type: VenueSingleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Venue not found' })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  delete(
    @Param('venueId', ParseUUIDPipe) venueId: string,
  ): Promise<VenueSingleResponseDto> {
    return this.venueService.delete(venueId);
  } //END_delete

  @Patch(':venueId/building')
  @Roles('uni_admin')
  @ApiOperation({
    description: 'Send buildingId to assign or null to unassign the venue',
    summary: 'Assign a venue to a building',
  })
  @ApiOkResponse({
    description: 'Venue updated successfully',
    type: VenueMappingDto,
  })
  @ApiNotFoundResponse({ description: 'Venue not found' })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  @ApiBadRequestResponse({
    description: 'Building does not belong to the selected university',
  })
  assignBuilding(
    @CurrentSession() session: SessionData,
    @Param('venueId') venueId: string,
    @Body() assignVenueDto: AssignVenueBuildingDto,
  ): Promise<VenueMappingDto> {
    return this.venueService.assignBuilding(session, venueId, assignVenueDto);
  }

  @Post('assign')
  @Roles('uni_admin')
  @ApiOperation({
    description:
      'Used by the venue mapping screen for multiple selection assignment',
    summary: 'Assign several venues to buildings in one request',
  })
  @ApiForbiddenResponse({ description: 'Wrong permissions bud' })
  @ApiOkResponse({
    description: 'Venues updated successfully',
    type: BulkAssignResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'One/more buildings do not belong to the selected university',
  })
  bulkAssign(
    @CurrentSession() session: SessionData,
    @Body() bulkAssignDto: BulkAssignVenuesDto,
  ): Promise<{ updated: number; success: boolean }> {
    return this.venueService.bulkAssign(session, bulkAssignDto);
  }
}
