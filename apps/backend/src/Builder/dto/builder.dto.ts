import {ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length} from 'class-validator';
import {PartialType, PickType, OmitType, IntersectionType} from '@nestjs/swagger';
import { isNotNull } from 'drizzle-orm';

import { CreateModuleDto, ModulesDto, ModuleSingleResponseDto, UpdateModuleDto } from 'src/Module/dto/module.dto';

export class CreateBuilderModuleDto extends CreateModuleDto {

}

//Update
export class UpdateBuilderDto extends UpdateModuleDto {}

//Responses
    //Single
    export class BuilderSingleResponseDto 
        extends IntersectionType(
            ModuleSingleResponseDto, 
            PickType(CreateBuilderModuleDto, ['styling'] as const)) {}

    //List
    export class BuilderListResponseDto {
        @ApiProperty({
            type: [BuilderSingleResponseDto],
            description: 'List of Modules created by user with optional styling'
        })
        modules!: BuilderSingleResponseDto[];
    }

