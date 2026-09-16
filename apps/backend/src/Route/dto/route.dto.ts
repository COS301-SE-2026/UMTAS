import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Shared zero-based route ordering metadata.
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
 * Database-backed walking route between two buildings.
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
    type: [LatLngDto],
    isArray: true,
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

/**
 * Student daily-route date request.
 */
export class StudentRoutesQueryDto {
  @ApiProperty({
    description: 'Calendar date for which the student needs routes.',
    example: '2026-09-16',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: 'date must be in the format YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  date!: string;
} //END_StudentRoutesQueryDto

/**
 * Event context resolved for a concrete route date.
 */
export class RouteEventContextDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  eventId!: string;

  @ApiProperty({
    example: 'COS 301 Lecture',
  })
  @IsString()
  eventName!: string;

  @ApiProperty({
    description: 'Concrete occurrence date used for this route request.',
    example: '2026-09-16',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN)
  @IsDateString({ strict: true })
  occurrenceDate!: string;

  @ApiProperty({
    example: '08:30',
  })
  @Matches(TIME_ONLY_PATTERN)
  startTime!: string;

  @ApiProperty({
    example: '10:20',
  })
  @Matches(TIME_ONLY_PATTERN)
  endTime!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  venueId!: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  buildingId!: string | null;
} //END_RouteEventContextDto

/**
 * Route between two consecutive student events.
 */
export class StudentRouteTransitionDto {
  @ApiProperty({
    type: RouteEventContextDto,
  })
  @ValidateNested()
  @Type(() => RouteEventContextDto)
  originEvent!: RouteEventContextDto;

  @ApiProperty({
    type: RouteEventContextDto,
  })
  @ValidateNested()
  @Type(() => RouteEventContextDto)
  destinationEvent!: RouteEventContextDto;

  @ApiProperty({
    description: 'True when both events resolve to the same building.',
    example: false,
  })
  @IsBoolean()
  sameBuilding!: boolean;

  @ApiPropertyOptional({
    type: RouteDto,
    nullable: true,
    description:
      'Walking route, or null when the events share a building or routing is unavailable.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteDto)
  route!: RouteDto | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Reason when a walking route cannot be returned.',
    example: 'Destination venue has no building assigned.',
  })
  @IsOptional()
  @IsString()
  reason?: string | null;
} //END_StudentRouteTransitionDto

/**
 * Student routes between all consecutive events on a date.
 */
export class StudentRoutesResponseDto {
  @ApiProperty({
    description: 'Requested calendar date.',
    example: '2026-09-16',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN)
  @IsDateString({ strict: true })
  date!: string;

  @ApiProperty({
    type: [RouteEventContextDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteEventContextDto)
  events!: RouteEventContextDto[];

  @ApiProperty({
    type: [StudentRouteTransitionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentRouteTransitionDto)
  routes!: StudentRouteTransitionDto[];
} //END_StudentRoutesResponseDto

/**
 * Alternative route request between two events.
 */
export class AlternativeRoutesQueryDto {
  @ApiProperty({
    format: 'uuid',
    description: 'The event from which the student is travelling.',
  })
  @IsUUID()
  originEventId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'The event to which the student is travelling.',
  })
  @IsUUID()
  destinationEventId!: string;

  @ApiProperty({
    description: 'Calendar date on which both events occur.',
    example: '2026-09-16',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: 'date must be in the format YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  date!: string;

  @ApiPropertyOptional({
    description:
      'Zero-based route index. Index 0 is the shortest/default route.',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  routeIndex = 0;
} //END_AlternativeRoutesQueryDto

/**
 * Route candidate returned for an alternative-route request.
 */
export class AlternativeRouteDto extends RouteVariantDto {
  @ApiProperty({
    type: [LatLngDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  pathCoordinates!: LatLngDto[];

  @ApiProperty({
    example: 820,
    minimum: 0,
    description: 'The route distance in metres.',
  })
  @IsInt()
  @Min(0)
  distanceMetres!: number;

  @ApiProperty({
    description: 'True for route index 0, the provider-selected default route.',
    example: true,
  })
  @IsBoolean()
  isRecommended!: boolean;
} //END_AlternativeRouteDto

/**
 * Selected alternative route response between two events.
 */
export class AlternativeRoutesResponseDto {
  @ApiProperty({
    example: '2026-09-16',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN)
  @IsDateString({ strict: true })
  date!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  originEventId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  destinationEventId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  originBuildingId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  destinationBuildingId!: string;

  @ApiProperty({
    type: AlternativeRouteDto,
  })
  @ValidateNested()
  @Type(() => AlternativeRouteDto)
  route!: AlternativeRouteDto;
} //END_AlternativeRoutesResponseDto
