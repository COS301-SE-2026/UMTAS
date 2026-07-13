import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { SolverPreferences } from 'shared-types';

export class TimetableSolveJobDto {
  @ApiProperty({
    example: 'legacy-client-id',
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  jobId?: string;

  @ApiProperty({ example: 'default' })
  @IsString()
  @IsNotEmpty()
  solverProfileKey!: string;

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  @IsIn(['feasibility', 'optimization'])
  solveMode!: 'feasibility' | 'optimization';

  @ApiProperty({
    enum: ['auto', 'cp-sat', 'ga'],
    required: false,
    default: 'auto',
  })
  @IsOptional()
  @IsIn(['auto', 'cp-sat', 'ga'])
  engine?: 'auto' | 'cp-sat' | 'ga';

  @ApiProperty({ required: false, example: { heuristics: [] } })
  @IsOptional()
  @IsObject()
  preferences?: SolverPreferences;
}
