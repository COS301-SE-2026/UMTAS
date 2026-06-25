import {ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length} from 'class-validator';
import {PartialType, PickType, OmitType} from '@nestjs/swagger';
import { isNotNull } from 'drizzle-orm';

import { CreateModuleDto } from 'src/Module/dto/module.dto';

export class CreateBuilderModuleDto extends PickType(CreateModuleDto, ['code', 'name', 'description']) {}