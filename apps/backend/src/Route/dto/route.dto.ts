import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsHexColor,
  IsInt,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { LatLngDto } from 'src/Building/dto/building.dto';

export class RouteQueryDto {
  @ApiProperty({
    format: 'uuid',
    description: 'The origin building that the student is walking from',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  originBuildingId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'The destination building that the student is walking to',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  destinationBuildingId!: string;
}

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
    description: 'List of lat/long coordinates for the route path',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  pathCoordinates!: LatLngDto[];

  @ApiProperty({
    example: 67,
    description: 'The route distance in metres',
  })
  @IsInt()
  @IsPositive()
  distanceMetres!: number;

  @ApiProperty({
    example: '#0000FF',
    description: 'The hex colour for the polyline (path)',
  })
  @IsHexColor()
  displayColour!: string;
}

export class RouteSingleResponseDto {
  @ApiProperty({
    type: RouteDto,
  })
  @ValidateNested()
  @Type(() => RouteDto)
  route!: RouteDto;
}
