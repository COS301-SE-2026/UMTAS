import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class MapConfigDto {
  @ApiProperty({
    description: 'North part of the campus',
    example: 69.69,
  })
  NorthLat!: number;

  @ApiProperty({
    description: 'South part of the campus',
    example: 67.67,
  })
  SouthLat!: number;

  @ApiProperty({
    description: 'East part of the campus',
    example: 67.67,
  })
  EastLng!: number;

  @ApiProperty({
    description: 'West part of the campus',
    example: -67.67,
  })
  WestLng!: number;

  @ApiProperty({
    description: 'The zoom level for the map',
    example: 10,
  })
  DefaultZoom!: number;

  @ApiProperty({
    description: 'Id for the google map id for cloud styling',
    example: 'lalala-123',
    nullable: true,
  })
  GoogleMapID!: string;
}

export class UpdateMapConfigDto {
  @ApiProperty({
    description: 'North part of the campus',
    example: 69.69,
  })
  @IsLatitude()
  NorthLat!: number;

  @ApiProperty({
    description: 'South part of the campus',
    example: 67.67,
  })
  @IsLatitude()
  SouthLat!: number;

  @ApiProperty({
    description: 'East part of the campus',
    example: 67.67,
  })
  @IsLongitude()
  EastLng!: number;

  @ApiProperty({
    description: 'West part of the campus',
    example: -67.67,
  })
  @IsLongitude()
  WestLng!: number;

  @ApiProperty({
    description: 'The zoom level for the map',
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  DefaultZoom!: number;

  @ApiProperty({
    description: 'Id for the google map id for cloud styling',
    example: 'lalala-123',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  GoogleMapID!: string;
}
