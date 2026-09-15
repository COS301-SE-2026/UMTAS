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
import { VenueService } from './venue.service';
import { Roles } from 'src/auth/roles.guard';
import {
  CurrentSession,
  CurrentUniId,
  type SessionData,
} from 'src/auth/session.decorator';
import {
  BulkAssignResponseDto,
  BulkAssignVenuesDto,
  CreateVenueDto,
  UpdateVenueDto,
  VenueListResponseDto,
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
    @CurrentUniId() uniId: string,
    @Body() dto: CreateVenueDto,
  ): Promise<VenueSingleResponseDto> {
    return this.venueService.create({
      ...dto,
      UniversityID: uniId,
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
    type: VenueListResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No uni selected or no role at uni',
  })
  getAllVenues(
    @CurrentUniId() uniId: string,
    @Query() query: VenueQueryDto,
  ): Promise<VenueListResponseDto> {
    return this.venueService.getAllVenues(uniId, query);
  } //END_getAllVenues

  //Update
  @Patch(':venueId')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Update a venue',
    description:
      'Update venue name, capacity and/or building assignment. Only fields present in the body are updated.',
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
    @CurrentUniId() uniId: string,
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @Body() dto: UpdateVenueDto,
  ): Promise<VenueSingleResponseDto> {
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
  delete(
    @Param('venueId', ParseUUIDPipe) venueId: string,
  ): Promise<VenueSingleResponseDto> {
    return this.venueService.delete(venueId);
  } //END_delete

  @Post('assign')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Assign venues to buildings',
    description: 'Assign one or many venues to buildings in a single request.',
    operationId: 'assignVenuesToBuildings',
  })
  @ApiBody({ type: BulkAssignVenuesDto })
  @ApiOkResponse({
    description: 'Venues updated successfully',
    type: BulkAssignResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'One or more buildings or venues do not belong to the selected university',
  })
  @ApiForbiddenResponse({ description: 'Wrong permissions' })
  assignMany(
    @CurrentUniId() uniId: string,
    @CurrentSession() session: SessionData,
    @Body() dto: BulkAssignVenuesDto,
  ): Promise<BulkAssignResponseDto> {
    return this.venueService.assignVenuesToBuildings(uniId, dto.assignments);
  } //END_assignMany
} //END_VenueController
