import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.guard';
import { RouteQueryDto, RouteSingleResponseDto } from './dto/route.dto';
import { CurrentSession, type SessionData } from 'src/auth/session.decorator';
import { RouteService } from './route.service';

@ApiTags('Routes')
@ApiSecurity('umtas-session')
@Controller('routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  @Roles('student')
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
    @CurrentSession() session: SessionData,
    @Query() query: RouteQueryDto,
  ): Promise<RouteSingleResponseDto> {
    return this.routeService.getOrCreateRoute(
      session,
      query.originBuildingId,
      query.destinationBuildingId,
    );
  }
}
