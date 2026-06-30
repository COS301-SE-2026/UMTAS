import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { PartialType, PickType, OmitType } from '@nestjs/swagger';

export class UniversityDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a university',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  UniversityID!: string;

  @ApiProperty({
    example: 'University of Pretoria',
    description: 'Name of the university',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 30)
  UniversityName!: string;
} //UniversityDto

//Create
export class CreateUniversityDto extends PickType(UniversityDto, [
  'UniversityName',
] as const) {}

//Update
export class UpdateUniversityDto extends PartialType(
  OmitType(UniversityDto, ['UniversityID'] as const),
) {}

//Response
//Single
export class UniversitySingleResponseDto extends UniversityDto {}

//List
export class UniversityListResponseDto {
  @ApiProperty({
    type: [UniversityDto],
    description: 'list of universities',
  })
  universities!: UniversityDto[];
}

//Delete
export class DeleteUniversityResponseDto extends PickType(UniversityDto, [
  'UniversityName',
]) {
  @ApiProperty({ example: true })
  success!: boolean;
}
