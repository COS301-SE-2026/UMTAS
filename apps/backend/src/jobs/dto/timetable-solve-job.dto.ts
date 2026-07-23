import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import type { SolverPreferences } from 'shared-types';
import { SolverPreferencesDto } from './worker-contract.dto';

export class TimetableSolveJobDto {
  @ApiProperty({
    type: [String],
    required: false,
    example: ['00000000-0000-4000-8000-000000000004'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  eventIds?: string[];

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  @IsIn(['feasibility', 'optimization'])
  solveMode!: 'feasibility' | 'optimization';

  @ApiPropertyOptional({
    enum: ['auto', 'cp-sat', 'ga'],
  })
  @IsOptional()
  @IsIn(['auto', 'cp-sat', 'ga'])
  engine?: 'auto' | 'cp-sat' | 'ga';

  @ApiProperty({
    type: SolverPreferencesDto,
    required: false,
    example: { heuristics: [] },
  })
  @IsOptional()
  @IsObject()
  preferences?: SolverPreferences;
}
