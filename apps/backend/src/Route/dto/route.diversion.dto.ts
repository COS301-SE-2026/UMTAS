import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RouteDto } from './route.dto';
import { Type } from 'class-transformer';

/**
 * Diversion Request
 */
export class DiversionRequestDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Origin route UUID',
  })
  @IsUUID()
  fromRoute!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Destination route UUID.',
  })
  @ValidateIf((o) => o.toRouteIndex == null)
  @IsUUID()
  toRoute?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Destination route index.',
  })
  @ValidateIf((o) => o.toRoute == null)
  @IsInt()
  @Min(0)
  toRouteIndex?: number;

  @ApiProperty({
    example: 25,
    description: 'Divert x amount of fromRoute -> toRoute',
  })
  @IsNumber()
  diversion!: number;
} // END_DiversionRequestDto

/**
 * Diversion Route Response
 */
export class DiversionRouteResponseDto {
  @ApiProperty({
    type: RouteDto,
  })
  @ValidateNested()
  @Type(() => RouteDto)
  fromRoute!: RouteDto;

  @ApiProperty({
    type: RouteDto,
  })
  @ValidateNested()
  @Type(() => RouteDto)
  toRoute!: RouteDto;

  @ApiProperty({
    example: 25,
  })
  @IsNumber()
  diversion!: number;
} // END_DiversionRouteResponseDto
