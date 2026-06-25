import {ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length} from 'class-validator';
import {PartialType, PickType, OmitType} from '@nestjs/swagger';

export class UniversityDto {

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Unique identifier for a university',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    universityID!: string;

    @ApiProperty({
        example: 'University of Pretoria',
        description: 'Name of the university',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    @Length(2, 30)
    universityName!: string;
}//UniversityDto

//Create
export class CreateUniversityDto extends PickType(UniversityDto, ['universityName'] as const) {}

//Update
export class UpdateUniversityDto extends PartialType(OmitType(UniversityDto, ['universityID'] as const)) {}

//Response
export class UniversityResponseDto extends UniversityDto {}