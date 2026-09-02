import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
  VenueMappingDto,
  VenueMappingListResponseDto,
  VenueQueryDto,
} from './dto/venue.dto';

@ApiTags('Venues')
@ApiSecurity('umtas-session')
@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Get()
  @Roles('student')
  @ApiOperation({
    description: 'Get all venues from current selected uni',
    summary: 'Get all venues',
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
  }

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
