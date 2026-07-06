import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { PartialType, PickType, OmitType } from '@nestjs/swagger';
import { RoleType, RoleTypeType } from '../../entities/index';

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

  @ApiProperty({
    enum: RoleType.enumValues,
    example: 'STUDENT',
    description: 'Role current user has for university',
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleType.enumValues)
  role?: RoleTypeType | null;
} //UniversityDto

//Create
export class CreateUniversityDto extends PickType(UniversityDto, [
  'UniversityName',
] as const) {}

//Update
export class UpdateUniversityDto extends PartialType(
  OmitType(UniversityDto, ['UniversityID', 'role'] as const),
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

//Apply for uni role
export class ApplyForUniRoleDto extends PickType(UniversityDto, [
  'UniversityID',
  'role',
]) {}

//Approve users role
export class ApproveUsersRoleDto extends PickType(UniversityDto, [
  'UniversityID',
]) {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
  })
  @IsUUID()
  userId!: string;
}

export class ApprovedUserRoleResponse extends PickType(ApproveUsersRoleDto, [
  'userId',
]) {
  @ApiProperty({ example: true })
  success!: boolean;
}
export class GetRolesDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  UserID!: string;

  @ApiProperty({
    example: 'xxx@umtas.com',
  })
  @IsEmail()
  Email!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000',
  })
  UniversityID!: string;

  @ApiProperty({
    enum: RoleType.enumValues,
    nullable: true,
    example: 'LECTURER_PENDING',
  })
  role!: RoleTypeType | null;
}

export class GetRoleFilterDto {
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'True for only pending applications, false for all roles for uni',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  pending?: boolean;
}
