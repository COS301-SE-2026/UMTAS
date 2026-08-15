import { ApiProperty } from '@nestjs/swagger';

export class VenueMappingDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  venueId!: string;

  @ApiProperty({
    example: 'IT-2-26',
  })
  venueName!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  buildingId!: string | null;

  @ApiProperty({
    example: 'IT Building',
  })
  buildingName!: string | null;
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
    description: 'Assigns a venue to a building',
  })
  buildingId!: string | null;
}

export class BulkAssignVenuesDto {
  assignments!: { venueId: string; buildingId: string | null }[]; //minimum
}
