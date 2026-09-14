import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';
import { BaseVenueDto } from 'src/Venue/dto/venue.dto';

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

//Base building dto
export class BaseBuildingDto {
  @ApiProperty({
    description: 'Unique building identifier.',
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  BuildingID!: string;

  @ApiProperty({
    description: 'Building name. Unique per university. Max 100 chars.',
    maxLength: 100,
    example: 'Information Technology Building',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  BuildingName!: string;

  @ApiProperty({
    description: 'Owning university. Required.',
    format: 'uuid',
  })
  @IsUUID()
  UniversityID!: string;

  @ApiPropertyOptional({
    description:
      'Map position. Omit if the building has not been placed on the map yet.',
    type: LatLngDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LatLngDto)
  location?: LatLngDto | null;

  @ApiPropertyOptional({
    description:
      'GeoJSON Polygon outlining the building. Positions are [long, lat]. Send null to clear.',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  footprint?: GeoJsonPolygon | null;

  @ApiPropertyOptional({
    description: 'Icon key used when rendering the building marker.',
    maxLength: 64,
    nullable: true,
    example: 'school',
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  icon?: string | null;

  @ApiPropertyOptional({
    description: 'Hex colour used when rendering the building.',
    nullable: true,
    example: '#4A5548',
  })
  @IsOptional()
  @IsHexColor()
  displayColour?: string | null;
} //END_BaseBuildingDto

//Create Dto
export class CreateBuildingDto extends PickType(BaseBuildingDto, [
  'BuildingName',
  'location',
  'footprint',
  'icon',
  'displayColour',
] as const) {}

//Create service input
export class CreateBuildingInput extends CreateBuildingDto {
  UniversityID!: string;
  CreatedBy?: string | null;
} //END_CreateBuildingInput

export class UpdateBuildingDto extends PartialType(
  PickType(BaseBuildingDto, [
    'BuildingName',
    'location',
    'footprint',
    'icon',
    'displayColour',
  ] as const),
) {}

export class UpdateBuildingInput extends UpdateBuildingDto {} //END_UpdateBuildingInput

//Responses
export class BuildingSingleResponseDto {
  @ApiProperty({ type: BaseBuildingDto })
  building!: BaseBuildingDto;

  venues?: BaseVenueDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
} //END_BuildingSingleResponseDto

export class BuildingDto extends BaseBuildingDto {
  @ApiProperty({ example: 12 })
  venueCount!: number;
} //END_BuildingDto

export class BuildingListResponseDto {
  @ApiProperty({ type: [BuildingDto] })
  buildings!: BuildingDto[];

  venueCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
} //END_BuildingListResponseDto

// Query
export class BuildingQueryDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'True: building with pin. False: only buildings without pin. Omit for all buildings.',
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

export class DeleteBuildingResponseDto {
  @ApiProperty({ example: 'IT Building' })
  buildingName!: string;

  @ApiProperty({ example: true })
  success!: boolean;
} //END_DeleteBuildingResponseDto
