import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class StatsFiltersDto {
  @ApiPropertyOptional({
    example: undefined,
    description: 'Enable stats = TRUE',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (
      value === 't' ||
      value === 'true' ||
      value === 'True' ||
      value === 'TRUE' ||
      value === true ||
      value === '1' ||
      value === 1
    )
      return true;
    else return false;
  })
  Stats?: boolean;
}

export class StatsResponseDto {
  @ApiPropertyOptional({
    type: Number,
    example: 68,
    description: 'Count of Modules',
  })
  @IsNumber()
  @IsOptional()
  count?: number;
}
