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

//Date period for heatmap response
export class BuildingHeatmapPeriodDto {
  @ApiProperty({
    example: '2026-09-15',
    format: 'date',
  })
  from!: string;

  @ApiProperty({
    example: '2026-09-15',
    format: 'date',
  })
  to!: string;
}

//Request dto for building heatmaps
export class BuildingHeatmapQueryDto {
  @ApiPropertyOptional({
    description: 'Inclusive start date for attendance aggregation.',
    example: '2026-09-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end date for attendance aggregation.',
    example: '2026-09-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @ApiPropertyOptional({
    description: 'Attendance values to include in the response.',
    enum: BuildingHeatmapView_ENUM,
    default: BuildingHeatmapView_ENUM.ALL,
  })
  @IsOptional()
  @IsEnum(BuildingHeatmapView_ENUM)
  view: BuildingHeatmapView_ENUM = BuildingHeatmapView_ENUM.ALL;
} //END_BuildingHeatmapQueryDto

//Heatmap response per venue
export class VenueHeatmapDto extends IntersectionType(
  PickType(BaseVenueDto, ['VenueID', 'VenueName'] as const),
  BaseHeatmapMetricsDto,
) {} //END_VenueHeatmapDto

//Building specific heatmap response
export class BuildingHeatmapSummaryDto extends BaseHeatmapMetricsDto {}

//HeatMap response
export class BuildingHeatmapResponseDto {
  @ApiProperty({
    type: BaseBuildingDto,
  })
  building!: BaseBuildingDto;

  @ApiProperty({
    type: BuildingHeatmapPeriodDto,
  })
  period!: BuildingHeatmapPeriodDto;

  @ApiProperty({
    type: BuildingHeatmapSummaryDto,
  })
  summary!: BuildingHeatmapSummaryDto;

  @ApiProperty({
    type: [VenueHeatmapDto],
  })
  venues!: VenueHeatmapDto[];
} //END_BuildingHeatmapResponseDto
