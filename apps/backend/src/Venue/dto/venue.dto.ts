import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

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
