import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  PickType,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { BaseBuildingDto } from './building.dto';
import { BaseVenueDto } from 'src/Venue/dto/venue.dto';

//ENUM for views
export enum BuildingHeatmapView_ENUM {
  PROJECTED = 'projected',
  WORST_CASE = 'worstCase',
  ALL = 'all',
} //END_BuildingHeatmapView

//Base metrics used for heatmaps
export class BaseHeatmapMetricsDto {
  @ApiProperty({
    description: 'Total capacity represented by this heatmap item.',
    example: 120,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  Capacity!: number;

  @ApiProperty({
    description: 'Expected attendance based on attendance intent.',
    example: 45,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  projected!: number;

  @ApiProperty({
    description: 'Maximum expected attendance based on module enrolments.',
    example: 120,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  worstCase!: number;

  @ApiProperty({
    description:
      'Actual attendance. Null until a check-in source is implemented.',
    example: null,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actual!: number | null;

  @ApiProperty({
    description:
      'Projected attendance divided by capacity. Null when capacity is zero.',
    example: 0.375,
    nullable: true,
  })
  @IsNumber()
  projectedUtilisation!: number | null;

  @ApiProperty({
    description:
      'Worst-case attendance divided by capacity. Null when capacity is zero.',
    example: 1,
    nullable: true,
  })
  @IsNumber()
  worstCaseUtilisation!: number | null;
} //END_BaseHeatmapMetricsDto

//Request dto for building heatmaps
export class BuildingHeatmapQueryDto {
  @ApiPropertyOptional({
    description:
      'Date heatmap needs to compute. Default date is the current day',
    example: '2026-09-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({
    description: 'Attendance values to include in the response.',
    enum: BuildingHeatmapView_ENUM,
    default: BuildingHeatmapView_ENUM.ALL,
  })
  @IsOptional()
  @IsEnum(BuildingHeatmapView_ENUM)
  view: BuildingHeatmapView_ENUM = BuildingHeatmapView_ENUM.ALL;
} //END_BuildingHeatmapQueryDto

//Hourly buckets for heatmap
export class HourlyHeatmapBucketDto extends BaseHeatmapMetricsDto {
  @ApiProperty({
    example: 10,
    minimum: 0,
    maximum: 23,
    description: 'Hour of the day that the bucket represents',
  })
  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;
} //END_HourlyHeatmapBucketDto

//Heatmap response per venue
export class VenueHeatmapDto extends IntersectionType(
  PickType(BaseVenueDto, ['VenueID', 'VenueName'] as const),
  BaseHeatmapMetricsDto,
) {
  @ApiProperty({
    description: 'The vnue splits into 24 hour buckets',
    type: [HourlyHeatmapBucketDto],
  })
  hourly!: HourlyHeatmapBucketDto[];
} //END_VenueHeatmapDto

//Building specific heatmap response
export class BuildingHeatmapSummaryDto extends BaseHeatmapMetricsDto {}

//HeatMap response
export class BuildingHeatmapResponseDto {
  @ApiProperty({
    type: BaseBuildingDto,
  })
  building!: BaseBuildingDto;

  @ApiProperty({
    example: '2026-10-12',
    format: 'date',
  })
  date!: string;

  @ApiProperty({
    type: [HourlyHeatmapBucketDto],
    description:
      'The building splits into 24 hour buckets, summed across all of its assigned venues',
  })
  hourly!: HourlyHeatmapBucketDto[];

  @ApiProperty({
    type: BuildingHeatmapSummaryDto,
  })
  summary!: BuildingHeatmapSummaryDto;

  @ApiProperty({
    type: [VenueHeatmapDto],
  })
  venues!: VenueHeatmapDto[];
} //END_BuildingHeatmapResponseDto

//Heatmap response for all buildings

export class AllBuildingsHeatmapResponseDto {
  @ApiProperty({ type: [BuildingHeatmapResponseDto] })
  buildings!: BuildingHeatmapResponseDto[];
} //END_AllBuildingsHeatmapResponseDto
