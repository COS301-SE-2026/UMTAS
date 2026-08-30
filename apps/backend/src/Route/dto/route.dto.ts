import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
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

export enum ActiveRouteStatus {
  AT_VENUE = 'AT_VENUE',
  MOVING = 'MOVING',
  NONE = 'NONE',
}

export class ActiveRouteQueryDto {
  @ApiProperty({
    description: 'Calendar date that matches the EventAttendance date',
    example: '2026/10/12',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Time in hh:mm',
    example: '10:12',
  })
  @IsString()
  time!: string;
}

export class RouteSingleResponseDto {
  @ApiProperty({
    type: RouteDto,
  })
  @ValidateNested()
  @Type(() => RouteDto)
  route!: RouteDto;
}

export class ActiveRouteResponseDto {
  @ApiProperty({
    enum: ActiveRouteStatus,
    enumName: 'ActiveRouteStatus',
    example: ActiveRouteStatus.MOVING,
  })
  @IsEnum(ActiveRouteStatus)
  status!: ActiveRouteStatus;

  @ApiProperty({
    format: 'uuid',
    required: false,
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsUUID()
  @IsOptional()
  currentBuildingId?: string | null;

  @ApiProperty({
    type: () => RouteDto,
    required: false,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => RouteDto)
  route?: RouteDto;

  @ApiProperty({
    example: 'Lecture 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  fromEventName?: string;

  @ApiProperty({
    example: 'Lecture 2',
    required: false,
  })
  @IsOptional()
  @IsString()
  toEventName?: string;
}
