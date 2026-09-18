import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LatLngDto } from 'src/Building/dto/building.dto';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export enum RoutingHeatmapView {
  PROJECTED = 'projected',
  WORST_CASE = 'worstCase',
  ALL = 'all',
}

/**
 * Date and metric selection for a routing heatmap
 */
export class RoutingHeatmapQueryDto {
  @ApiProperty({
    description: 'Date for which to return route heatmap statistics',
    example: '2026-09-18',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: 'date format is YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  date!: string;

  @ApiPropertyOptional({
    description: 'WHich metrics to include',
    enum: RoutingHeatmapView,
    default: RoutingHeatmapView.ALL,
  })
  @IsOptional()
  @IsEnum(RoutingHeatmapView)
  view: RoutingHeatmapView = RoutingHeatmapView.ALL;
} //RoutingHeatmapQueryDto

/**
 * Attendance demand metrics for a route
 */
export class RouteHeatmapMetricsDto {
  @ApiProperty({
    description: 'Expected number of students projected to travel route',
    example: 42,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  projected!: number;

  @ApiProperty({
    description: 'Maximum expected route demand based on enrollments.',
    example: 85,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  worstCase!: number;

  @ApiProperty({
    description: 'Actual number of students recorded on the route',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actual!: number | null;
} //RouteHeatmapMetricsDto

/**
 * Demand metrics for one hour on a route
 */
export class RouteHeatmapHourlyBucketDto extends RouteHeatmapMetricsDto {
  @ApiProperty({
    description: 'Hour for this bucket | 0 - 23',
    example: 9,
    minimum: 0,
    maximum: 23,
  })
  @IsInt()
  @Min(0)
  hour!: number;
} //RouteHeatmapHourlyBucketDto

/**
 * Event transition contributing demand to a route
 */
export class RouteHeatmapTransitionDto {
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
    example: 'COS 301 Lecture',
  })
  @IsString()
  originEventName!: string;

  @ApiProperty({
    example: 'COS 301 Tutorial',
  })
  @IsString()
  destinationEventName!: string;

  @ApiProperty({
    example: '10:20',
  })
  @Matches(TIME_ONLY_PATTERN)
  originEndTime!: string;

  @ApiProperty({
    example: '11:00',
  })
  @Matches(TIME_ONLY_PATTERN)
  destinationStartTime!: string;

  @ApiProperty({
    description: 'Number of students projected to make this transition.',
    example: 20,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  projected!: number;

  @ApiProperty({
    description: 'Maximum expected students for this transition.',
    example: 35,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  worstCase!: number;
} //RouteHeatmapTransitionDto

/**
 * Building attached to route
 */
export class RouteHeatmapBuildingDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  buildingId!: string;

  @ApiProperty({
    example: 'Information Technology Building',
  })
  @IsString()
  buildingName!: string;
} //RouteHeatmapBuildingDto

/**
 * One route and its demand over date
 */
export class RouteHeatmapDto extends RouteHeatmapMetricsDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  routeId!: string;

  @ApiProperty({
    description: 'Zero-based route variant index',
    example: 0,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  routeIndex!: number;

  @ApiProperty({
    type: RouteHeatmapBuildingDto,
  })
  @ValidateNested()
  @Type(() => RouteHeatmapBuildingDto)
  origin!: RouteHeatmapBuildingDto;

  @ApiProperty({
    type: RouteHeatmapBuildingDto,
  })
  @ValidateNested()
  @Type(() => RouteHeatmapBuildingDto)
  destination!: RouteHeatmapBuildingDto;

  @ApiProperty({
    description: 'Walking distance in metres.',
    example: 650,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  distanceMetres!: number;

  @ApiProperty({
    type: [LatLngDto],
    description: 'Polyline coordinates for rendering the route.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  pathCoordinates!: LatLngDto[];

  @ApiProperty({
    type: [RouteHeatmapHourlyBucketDto],
    description: 'Demand split into 24 hourly buckets',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteHeatmapHourlyBucketDto)
  hourly!: RouteHeatmapHourlyBucketDto[];

  @ApiProperty({
    type: [RouteHeatmapTransitionDto],
    description: 'Events contributing demand to this route',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteHeatmapTransitionDto)
  transitions!: RouteHeatmapTransitionDto[];
} //RouteHeatmapDto

/**
 * Routing heatmap response for one university and date
 */
export class RoutingHeatmapResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  universityId!: string;

  @ApiProperty({
    example: '2026-09-18',
    format: 'date',
  })
  @Matches(DATE_ONLY_PATTERN)
  @IsDateString({ strict: true })
  date!: string;

  @ApiProperty({
    enum: RoutingHeatmapView,
  })
  @IsEnum(RoutingHeatmapView)
  view!: RoutingHeatmapView;

  @ApiProperty({
    type: [RouteHeatmapDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteHeatmapDto)
  routes!: RouteHeatmapDto[];
} //RoutingHeatmapResponseDto
