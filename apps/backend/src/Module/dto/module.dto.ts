import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({
    example: 'COS332',
    description: 'Module code used by the university',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code!: string;

  @ApiProperty({
    example: 'Computer Networks',
    description: 'Name of the module',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Introduction to computer networking concepts',
    description: 'Short module description',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Temporary user ID until auth context is connected',
  })
  @IsString()
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Optional display styling for the module',
  })
  @IsOptional()
  @IsString()
  styling?: string;
} //create

export class UpdateModuleDto {
  @ApiPropertyOptional({
    example: 'COS332',
    description: 'Updated module code',
  })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  code?: string;

  @ApiPropertyOptional({
    example: 'Computer Networks',
    description: 'Updated module name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Introduction to computer networking concepts',
    description: 'Updated module description',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Updated module styling',
  })
  @IsOptional()
  @IsString()
  styling?: string;
} //udpate

export class ModuleResponseDto {
  @ApiProperty({ example: 1 })
  moduleID!: number;

  @ApiProperty({ example: 'COS332' })
  moduleCode!: string;

  @ApiProperty({ example: 'Computer Networks' })
  moduleName!: string;

  @ApiPropertyOptional({
    example: 'Introduction to computer networking concepts',
    nullable: true,
  })
  moduleDescription?: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userID!: string;

  @ApiPropertyOptional({ example: '#3B82F6', nullable: true })
  styling?: string | null;
} //Response

export class SingleModuleResponseDto {
  @ApiProperty({ type: ModuleResponseDto })
  module!: ModuleResponseDto;
}

export class ModuleListResponseDto {
  @ApiProperty({ type: [ModuleResponseDto] })
  modules!: ModuleResponseDto[];
} //list

export class DeleteModuleResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
} //delete
