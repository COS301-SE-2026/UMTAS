import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  DATE_ONLY_PATTERN,
  RouteDto,
  RouteVariantDto,
  TIME_ONLY_PATTERN,
} from './route.dto';
import { Type } from 'class-transformer';
import { LatLngDto } from 'src/Building/dto/building.dto';

/**
 * Student request for routes on specific date
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
    description: 'Concrete occurrence date',
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
 * Route between two events
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

// ROute stop
/**
 * Request a temporary stop between a student's scheduled events.
 */
export class StudentStopRouteQueryDto {
  @ApiProperty({
    format: 'date',
    example: '2026-09-21',
    description: 'Date whose attended events should be used.',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Building the student wants to visit before their next class.',
  })
  @IsUUID()
  buildingId!: string;

  @ApiPropertyOptional({
    example: '10:30',
    description:
      'Optional time in HH:mm. When omitted, the largest gap between scheduled events is selected.',
  })
  @IsOptional()
  @Matches(TIME_ONLY_PATTERN, {
    message: 'time must be in the format HH:mm',
  })
  time?: string;
} //END_StudentStopRouteQueryDto

/**
 * A route leg for a temporary student stop.
 */
export class StudentStopRouteLegDto {
  @ApiProperty({
    enum: ['TO_STOP', 'FROM_STOP'],
  })
  @IsString()
  direction!: 'TO_STOP' | 'FROM_STOP';

  @ApiPropertyOptional({
    type: RouteEventContextDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteEventContextDto)
  originEvent?: RouteEventContextDto | null;

  @ApiPropertyOptional({
    type: RouteEventContextDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteEventContextDto)
  destinationEvent?: RouteEventContextDto | null;

  @ApiPropertyOptional({
    type: RouteDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RouteDto)
  route?: RouteDto | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  reason?: string;
} //END_StudentStopRouteLegDto

/**
 * Routes for visiting a temporary building before the next class.
 */
export class StudentStopRouteResponseDto {
  @ApiProperty({ format: 'date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  buildingId!: string;

  @ApiPropertyOptional({
    example: '10:30',
    nullable: true,
  })
  @IsOptional()
  @Matches(TIME_ONLY_PATTERN)
  time?: string | null;

  @ApiProperty({
    description: 'The gap or event interval selected for the temporary stop.',
  })
  @IsString()
  selectedWindow!: string;

  @ApiProperty({
    type: [StudentStopRouteLegDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentStopRouteLegDto)
  legs!: StudentStopRouteLegDto[];
} //END_StudentStopRouteResponseDto
