import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({
    example: 'COS332',
    description: 'Module code used by the university',
  })
  code!: string;

  @ApiProperty({
    example: 'Computer Networks',
    description: 'Name of the module',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Introduction to computer networking concepts',
    description: 'Short module description',
  })
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Temporary user ID until auth context is connected',
  })
  userId!: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Optional display styling for the module',
  })
  styling?: string;
}

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
  description?: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Updated module styling',
  })
  @IsOptional()
  @IsString()
  styling?: string;
}
