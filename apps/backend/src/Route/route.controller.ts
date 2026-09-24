import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.guard';
import {
  ActiveRouteQueryDto,
  ActiveRouteResponseDto,
  DiversionRequestDto,
  DiversionRouteResponseDto,
  RouteDto,
  RouteQueryDto,
  RouteSingleResponseDto,
  RouteVariantQueryDto,
  RoutingHeatmapQueryDto,
  RoutingHeatmapResponseDto,
  StudentStopRouteQueryDto,
  StudentStopRouteResponseDto,
} from './dto';
import {
  CurrentSession,
  CurrentUniId,
  type SessionData,
} from 'src/auth/session.decorator';
import { RouteService } from './route.service';
import { RouteHeatmapService } from './route.heatmap.service';
import { RouteDiversionService } from './route.diversion.service';
import { RouteStopService } from './route.stop.service';

@ApiTags('Routes')
@ApiSecurity('umtas-session')
@Controller('routes')
export class RouteController {
  constructor(
    private readonly routeService: RouteService,
    private readonly routeHeatmapService: RouteHeatmapService,
    private readonly diversionService: RouteDiversionService,
    private readonly routeStopService: RouteStopService,
  ) {}

  @Get('heatmap')
  @Roles()
  @ApiOperation({
    summary: 'Get route demand heatmap',
    description:
      'Returns route demand metrics for all persisted route variants in the selected university for a single date.',
    operationId: 'getRoutingHeatmap',
  })
  @ApiOkResponse({
    description: 'Routing heatmap returned successfully',
    type: RoutingHeatmapResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid routing heatmap query parameters',
  })
  @ApiForbiddenResponse({
    description: 'No university selected or insufficient permissions',
  })
  @ApiNotFoundResponse({
    description: 'Required route, event, venue, or building data was not found',
  })
  getRoutingHeatmap(
    @CurrentUniId() uniId: string,
    @Query() query: RoutingHeatmapQueryDto,
  ): Promise<RoutingHeatmapResponseDto> {
    return this.routeHeatmapService.getRoutingHeatmap(uniId, query);
  }

  @Get()
  @Roles('student', 'uni_admin')
  @ApiOperation({
    summary: 'Get a walking route between an origin and a destination building',
    description:
      'Returns cached route if one exists, otherwise fetches it from OpenRouteService and caches it in the DB.',
  })
  @ApiOkResponse({
    description: 'Route was returned successfully',
    type: RouteSingleResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No university or university role was selected',
  })
  @ApiNotFoundResponse({
    description:
      'One or both buildings have not been pinned, or no walking path was found between the two buildings',
  })
  getRoute(
    @CurrentUniId() uniId: string,
    @Query() query: RouteQueryDto,
  ): Promise<RouteSingleResponseDto> {
    return this.routeService.getOrCreateRoute(
      uniId,
      query.originBuildingId,
      query.destinationBuildingId,
    );
  }

  @Get('active')
  @Roles('student')
  @ApiOperation({
    description:
      'Returns whether the student as at a venue, moving between two venues, or has no planned event in that time',
    summary: 'Get student route status at certain date/time',
  })
  @ApiOkResponse({
    description: 'Route status returned successfully',
    type: ActiveRouteResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No university or university role was selected',
  })
  getActiveRoute(
    @CurrentUniId() uniId: string,
    @CurrentSession() session: SessionData,
    @Query() query: ActiveRouteQueryDto,
  ): Promise<ActiveRouteResponseDto> {
    return this.routeService.getActiveRoute(
      session.user.id,
      uniId,
      query.date,
      query.time,
    );
  }

  @Put('diversion')
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Create or update a route diversion',
    description:
      'University administrators can divert a proportion of traffic from one route to another.',
    operationId: 'routeDiversion',
  })
  @ApiOkResponse({
    description: 'Diversion successfully created or updated.',
    type: DiversionRouteResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request. Diversion must be between 0 and 1 and either toRoute or toRouteIndex must be supplied.',
  })
  @ApiNotFoundResponse({
    description:
      'The source route, destination route, or requested alternative route could not be found.',
  })
  async divertRoute(
    @CurrentUniId() uniId: string,
    @Body() dto: DiversionRequestDto,
  ): Promise<DiversionRouteResponseDto> {
    return this.diversionService.divertRoute(uniId, dto);
  }

  @Get('variant')
  @Roles('uni_admin')
  @ApiOkResponse({ type: RouteDto })
  getVariant(
    @CurrentUniId() uniId: string,
    @Query() query: RouteVariantQueryDto,
  ): Promise<RouteDto | null> {
    return this.routeService.getVariantOrNull(
      uniId,
      query.originBuildingId,
      query.destinationBuildingId,
      query.routeIndex,
    );
  }

  @Get('stop-route')
  @Roles('student')
  @ApiOperation({
    summary: 'Get a stop-via route for a student on a date',
    description:
      "Returns the route from the student's current event to a stop building and from the stop to the next event, based on the requested time or the largest gap.",
    operationId: 'getRouteViaBuilding',
  })
  @ApiOkResponse({
    description: 'Stop route returned successfully',
    type: StudentStopRouteResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid stop route query parameters',
  })
  @ApiNotFoundResponse({
    description:
      'No attended events found for the date, or no route could be determined for the stop',
  })
  @ApiForbiddenResponse({
    description: 'No university selected or insufficient permissions',
  })
  getRouteViaBuilding(
    @CurrentSession() session: SessionData,
    @CurrentUniId() uniId: string,
    @Query() query: StudentStopRouteQueryDto,
  ): Promise<StudentStopRouteResponseDto> {
    return this.routeStopService.getRouteViaBuilding(
      session.user.id,
      uniId,
      query,
    );
  }
}
