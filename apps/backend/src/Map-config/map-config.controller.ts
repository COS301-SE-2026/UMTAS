import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { MapConfigService } from './map-config.service';
import { Roles } from 'src/auth/roles.guard';
import { MapConfigDto, UpdateMapConfigDto } from './dto/map-config.dto';
import { CurrentSession, type SessionData } from 'src/auth/session.decorator';

@ApiTags('Map Config')
@ApiSecurity('umtas-session')
@Controller('map-config')
export class MapConfigController {
  constructor(private readonly mapConfigService: MapConfigService) {}

  @Get()
  @Roles('student')
  @ApiOperation({ summary: 'Get map settings for the selected university' })
  @ApiForbiddenResponse({ description: 'No university selected' })
  @ApiNotFoundResponse({ description: 'Map settings not configured boss' })
  @ApiOkResponse({ type: MapConfigDto })
  getMapConfig(@CurrentSession() session: SessionData): Promise<MapConfigDto> {
    return this.mapConfigService.getMapConfig(session);
  }

  @Put()
  @Roles('uni_admin')
  @ApiOperation({
    summary: 'Set or update map settings for the selected university',
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiOkResponse({ type: MapConfigDto })
  update(
    @CurrentSession() session: SessionData,
    @Body() updateMapConfigDto: UpdateMapConfigDto,
  ): Promise<MapConfigDto> {
    return this.mapConfigService.updateMapConfig(session, updateMapConfigDto);
  }
}
