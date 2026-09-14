import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BaseVenueDto {
  @ApiProperty({
    description: 'Unique venue identifier.',
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
  })
  @IsUUID()
  VenueID!: string;

  @ApiProperty({
    description: 'Venue name. Unique per university. Max 30 chars.',
    maxLength: 30,
    example: 'Main Lecture Hall',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  VenueName!: string;

  @ApiProperty({
    description: 'Owning university. Required.',
    format: 'uuid',
  })
  @IsUUID()
  UniversityID!: string;

  @ApiPropertyOptional({
    description:
      'Optional building identifier. Nulled if the building is deleted.',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  BuildingID?: string | null;
} //END_BaseVenueDto

//Create
export class CreateVenueDto extends PickType(BaseVenueDto, [
  'VenueName',
  'BuildingID',
]) {}

//Create Service Input
export class CreateVenueInput extends CreateVenueDto {
  UniversityID!: string;
} //END_CreateVenueInput

//Single Response
export class VenueSingleResponseDto {
  @ApiProperty({ type: BaseVenueDto })
  venue!: BaseVenueDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
} //END_VenueSingleResponseDto

//List response
export class VenueListResponseDto {
  @ApiProperty({ type: [BaseVenueDto] })
  venues!: BaseVenueDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
} //END_VenueListResponseDto

export class VenueMappingDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  venueId!: string;

  @ApiProperty({
    example: 'IT-2-26',
    nullable: true,
  })
  venueName!: string | null;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
    nullable: true,
  })
  buildingId!: string | null;

  @ApiProperty({
    example: 'IT Building',
    nullable: true,
  })
  buildingName!: string | null;
}

export class VenueQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mapped?: boolean;

  @ApiPropertyOptional({
    example: 'IT Building',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;
}

export class VenueMappingListResponseDto {
  @ApiProperty({
    type: [VenueMappingDto],
    description: 'List of venue mappings',
  })
  venues!: VenueMappingDto[];
}

export class AssignVenueBuildingDto {
  @ApiProperty({
    nullable: true,
    format: 'uuid',
    description: 'Assigns a venue to a building',
  })
  @IsOptional()
  @IsUUID()
  buildingId!: string | null;
}

export class VenueAssignmentDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID()
  venueId!: string;

  @ApiProperty({
    nullable: true,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  buildingId!: string | null;
}

export class BulkAssignVenuesDto {
  @ApiProperty({ type: [VenueAssignmentDto], minItems: 1 })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => VenueAssignmentDto)
  assignments!: VenueAssignmentDto[];
}

export class BulkAssignResponseDto {
  @ApiProperty({ example: 7 })
  updated!: number;

  @ApiProperty({ example: true })
  success!: boolean;
}
