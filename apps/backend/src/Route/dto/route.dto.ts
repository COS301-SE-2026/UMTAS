import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { LatLngDto } from 'src/Building/dto/building.dto';

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Index of route - 0 for shortest, 5 for 4th alternative
 */
export class RouteVariantDto {
  @ApiProperty({
    description:
      'Zero-based route index. Index 0 is the recommended shortest route.',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  routeIndex!: number;
} //END_RouteVariantDto

/**
 * Db walking route between two buildings
 */
export class RouteDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  routeId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  originBuildingId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  destinationBuildingId!: string;

  @ApiProperty({
    example: 0,
    minimum: 0,
    description:
      'Index of route | 0 for shortest, incrementally for alternatives.',
  })
  @IsInt()
  @Min(0)
  routeIndex!: number;

  @ApiProperty({
    type: [LatLngDto],
    description: 'List of latitude/longitude coordinates for the route path.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  pathCoordinates!: LatLngDto[];

  @ApiProperty({
    example: 67,
    description: 'The route distance in metres.',
  })
  @IsInt()
  @IsPositive()
  distanceMetres!: number;

  @ApiProperty({
    example: '#0000FF',
    description: 'The hex colour for the route polyline.',
  })
  @IsHexColor()
  displayColour!: string;
} //END_RouteDto

/**
 * Direct building-to-building route request.
 */
export class RouteQueryDto {
  @ApiProperty({
    format: 'uuid',
    description: 'The building the student is walking from.',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  originBuildingId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'The building the student is walking to.',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  destinationBuildingId!: string;
} //END_RouteQueryDto

/**
 * Response wrapper for a direct building route.
 */
export class RouteSingleResponseDto {
  @ApiProperty({
    type: RouteDto,
  })
  @ValidateNested()
  @Type(() => RouteDto)
  route!: RouteDto;
} //END_RouteSingleResponseDto

/**
 * Existing active-route status values.
 */
export enum ActiveRouteStatus {
  AT_VENUE = 'AT_VENUE',
  MOVING = 'MOVING',
  NONE = 'NONE',
} //END_ActiveRouteStatus

/**
 * Active-route date and time request.
 */
export class ActiveRouteQueryDto {
  @ApiProperty({
    description: 'Calendar date matching the EventAttendance date.',
    example: '2026-10-12',
    format: 'date',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Time in HH:mm format.',
    example: '10:12',
  })
  @Matches(TIME_ONLY_PATTERN, {
    message: 'time must be in the format HH:mm',
  })
  time!: string;
} //END_ActiveRouteQueryDto

/**
 * Existing active-route response.
 */
export class ActiveRouteResponseDto {
  @ApiProperty({
    enum: ActiveRouteStatus,
    enumName: 'ActiveRouteStatus',
    example: ActiveRouteStatus.MOVING,
  })
  @IsEnum(ActiveRouteStatus)
  status!: ActiveRouteStatus;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  currentBuildingId?: string | null;

  @ApiPropertyOptional({
    type: RouteDto,
    nullable: true,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => RouteDto)
  route?: RouteDto | null;

  @ApiPropertyOptional({
    example: 'Lecture 1',
  })
  @IsString()
  @IsOptional()
  fromEventName?: string;

  @ApiPropertyOptional({
    example: 'Lecture 2',
  })
  @IsString()
  @IsOptional()
  toEventName?: string;
} //END_ActiveRouteResponseDto
