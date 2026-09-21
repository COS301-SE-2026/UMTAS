import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import {
  ModulesDto,
  ModuleSingleResponseDto,
} from '../../Module/dto/module.dto';
import { ModuleTeaches } from 'src/entities';

export type ModuleTeachesType = typeof ModuleTeaches.$inferSelect;

export class CreateTeachesDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Module to assign the lecturer to',
  })
  @IsUUID()
  @IsNotEmpty()
  ModuleID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Lecturer user to assign to the module',
  })
  @IsUUID()
  @IsNotEmpty()
  UserID!: string;
} //END_CreateTeachesDto

export class TeachesResponseDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'User ID of the assigned lecturer',
  })
  @IsUUID()
  @IsNotEmpty()
  UserID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Module ID of the teaching assignment',
  })
  @IsUUID()
  @IsNotEmpty()
  ModuleID!: string;

  @ApiProperty({
    type: ModuleSingleResponseDto,
    description: 'Module assigned to the lecturer',
  })
  @ValidateNested()
  @Type(() => ModuleSingleResponseDto)
  module!: ModulesDto;
} //END_TeachesResponseDto

export class SelfAssignTeachesDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Module to assign the current user to',
  })
  @IsUUID()
  @IsNotEmpty()
  ModuleID!: string;
} //END_SelfAssignTeachesDto
