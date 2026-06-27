import {ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length} from 'class-validator';
import {PartialType, PickType, OmitType, IntersectionType} from '@nestjs/swagger';
import { isNotNull } from 'drizzle-orm';

import { CreateModuleDto, ModuleSingleResponseDto } from 'src/Module/dto/module.dto';

export class CreateBuilderModuleDto extends PickType(CreateModuleDto, ['moduleCode', 'moduleName', 'moduleDescription']) {

    @ApiProperty({
        example: '#3B82F6',
        type: String,
        description: 'String to define color for the module'
    })
    @IsString()
    @IsOptional()
    styling?: string;
}

//Update
export class UpdateBuilderDto extends PartialType(CreateBuilderModuleDto) {}

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

