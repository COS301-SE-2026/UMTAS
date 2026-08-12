import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export class LatLngDto {
  @ApiProperty({
    example: -25.7545,
    description: 'Latitude in decimal degrees',
  })
  @IsLatitude()
  lat!: number;

  @ApiProperty({
    example: 28.2314,
    description: 'Longitude in decimal degrees',
  })
  @IsLongitude()
  lng!: number;
}

//building requests
export class CreateBuildingDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 100,
    example: 'Information Technology Building',
    description: 'Name of the building. Must be unique within the university.',
  })
  @IsString()
  @Length(1, 100)
  buildingName!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: LatLngDto,
    description:
      'Map position. Omit to create the building unpinned. Admin places it then later.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LatLngDto)
  location?: LatLngDto | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [28.2314, -25.7545],
          [28.2318, -25.7545],
          [28.2318, -25.7549],
          [28.2314, -25.7549],
          [28.2314, -25.7545],
        ],
      ],
    },
    description:
      'GeoJSON Polygon outlining the building. Positions are [long, lat]. The ring must be closed...',
  })
  @IsOptional()
  @IsObject()
  footprint?: GeoJsonPolygon | null;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: 64,
    example: 'uni',
    description: 'Icon key used when rendering the building marker',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  icon?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '#4A5548',
    description: 'Hex colour used when rendering the building',
  })
  @IsOptional()
  @IsHexColor()
  displayColour?: string | null;
}

export class UpdateBuildingDto extends PartialType(CreateBuildingDto) {}

export class BuildingQueryDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'True: building with pin. False: only buildings without pinn. Omit for all buildings.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mapped?: boolean;

  @ApiPropertyOptional({
    example: 'IT',
    description: 'Search on building name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;
}

//responses for building requests

export class BuildingDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  buildingId!: string;

  @ApiProperty({ example: 'IT Building' })
  buildingName!: string;

  @ApiProperty({
    nullable: true,
    type: LatLngDto,
    description: 'null when the building has not been placed on the map yet',
  })
  location!: LatLngDto | null;

  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  footprint!: GeoJsonPolygon | null;

  @ApiProperty({ nullable: true, example: 'school' })
  icon!: string | null;

  @ApiProperty({ nullable: true, example: '#4A5468' })
  displayColour!: string | null;

  @ApiProperty({
    example: 12,
    description: 'Number of venues assigned to this building (current count)',
  })
  venueCount!: number;
}

export class BuildingSingleResponseDto {
  @ApiProperty({ type: BuildingDto })
  building!: BuildingDto;
}

export class BuildingListResponseDto {
  @ApiProperty({ type: [BuildingDto], description: 'List of buildings' })
  buildings!: BuildingDto[];
}

export class DeleteBuildingResponseDto {
  @ApiProperty({ example: 'IT Building' })
  buildingName!: string;

  @ApiProperty({ example: true })
  success!: boolean;
}
