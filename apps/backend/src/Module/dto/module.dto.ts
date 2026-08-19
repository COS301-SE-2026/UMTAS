import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsArray,
} from 'class-validator';
import {
  PartialType,
  PickType,
  OmitType,
  IntersectionType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PopulateGroupBodyDto } from '../../Grouping/dto/grouping.dto';
import { EventDto } from 'src/Events/dto/EventDto.dto';

export class CourseModuleDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'ID to identify Course Module entry',
  })
  @IsUUID('4', { message: 'CourseModuleID: Not in valid UUID format' })
  @IsNotEmpty()
  CourseModuleID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'ID to identify GroupModule entry metadata is for',
  })
  @IsUUID('4', { message: 'GroupModuleID: Not in valid UUID format' })
  @IsNotEmpty()
  GroupModuleID!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'ID to identify course owning this CourseModule',
  })
  @IsUUID('4', { message: 'CourseID: Not in valid UUID format' })
  @IsNotEmpty()
  CourseID!: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Identifies wether or not module is a core module of the course',
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === true) return true;
    else return false;
  })
  @IsNotEmpty()
  Core!: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'Semester 1',
    description:
      'Identifies which part of the year the module takes part in for the course',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  SemesterOfStudy?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Which year does the module belong to for the course',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  YearOfStudy?: number | null;
} //END_CourseModuleDto

export class CreateCourseModuleDto extends PickType(CourseModuleDto, [
  'Core',
  'SemesterOfStudy',
  'YearOfStudy',
]) {}

export class StylingDto {
  @ApiProperty({ example: '#3B82F6' })
  @IsString()
  @IsNotEmpty()
  colour!: string;
}

//Base class
export class ModulesDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a module',
  })
  @IsUUID()
  @IsNotEmpty()
  moduleID!: string;

  @ApiProperty({
    example: 'COS332',
    description: 'Module code used by the university',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 15)
  moduleCode!: string;

  @ApiProperty({
    example: 'Computer Networks',
    description: 'Name of the module',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  moduleName!: string;

  @ApiPropertyOptional({
    example: 'Introduction to computer networking concepts',
    description: 'Short module description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  moduleDescription?: string | null;

  @ApiProperty({
    description: 'Styling to be used for a Module',
    example: {
      colour: 'FFFFF',
    },
    type: StylingDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StylingDto)
  styling?: StylingDto | null;

  @ApiPropertyOptional({
    description: 'Metadata attached to module when owned by course',
    example: {
      CourseModuleID: '00000000-0000-0000-0000-000000000000',
      GroupModuleID: '00000000-0000-0000-0000-000000000000',
      CourseID: '00000000-0000-0000-0000-000000000000',
      core: true,
      SemesterOfStudy: 'Semester 1',
      YearOfStudy: 1,
    },
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CourseModuleDto)
  CourseModuleInfo?: CourseModuleDto | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Whether the module has been approved by a university admin',
  })
  @IsOptional()
  @IsBoolean()
  validated?: boolean;

  @ApiPropertyOptional({
    type: () => [EventDto],
    description: 'List of events for the module',
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  Events?: EventDto[] | null;

  @ApiPropertyOptional({
    example: '12345',
    description: 'Refer to module on external API',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  ExternalID?: string | null;
} //ModuleDto

//Create
export class CreateModuleDto extends PickType(ModulesDto, [
  'moduleCode',
  'moduleName',
  'moduleDescription',
  'styling',
  'validated',
  'ExternalID',
]) {
  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'ModuleGroupingID to identify group the module belongs to',
  })
  @IsOptional()
  @IsUUID()
  @IsOptional()
  ModuleGroupingID?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'CourseID module belongs to',
  })
  @IsOptional()
  @IsUUID()
  @IsOptional()
  CourseID?: string;

  @ApiProperty({
    description:
      'Course Module metadata to be used when module belongs to course',
    type: CreateCourseModuleDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateCourseModuleDto)
  CourseModuleInfo?: CreateCourseModuleDto;
} //CreateModuleDto

//Update
export class UpdateModuleDto extends IntersectionType(
  PartialType(OmitType(ModulesDto, ['moduleID', 'CourseModuleInfo'] as const)),
  PartialType(OmitType(CourseModuleDto, ['CourseModuleID', 'GroupModuleID'])),
) {} //update

//Responses
//Single
export class ModuleSingleResponseDto extends ModulesDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Unique identifier for a module group',
  })
  @IsUUID()
  @IsOptional()
  ModuleGroupingID?: string;
}

//List
export class ModuleListResponseDto {
  @ApiProperty({
    type: [ModuleSingleResponseDto],
    description: 'List of modules',
  })
  modules!: ModuleSingleResponseDto[];

  @ApiPropertyOptional({
    type: String,
    description: 'Short message indicating  success of response.',
  })
  message?: string;
}

//Delete
export class DeleteModuleResponseDto extends PickType(ModulesDto, [
  'moduleCode',
]) {
  @ApiProperty({ type: Boolean, example: true })
  success!: boolean;
} //delete

//GetAll filters
export class ModuleFiltersDto {
  @ApiPropertyOptional({
    description:
      'Filter by university ID - returns all modules across all courses in the university',
  })
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by course ID - returns all modules in the course',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by ModuleGrouping ID',
  })
  @IsOptional()
  @IsUUID()
  GroupID?: string;

  //Filter by code using wildcard
  @ApiPropertyOptional({
    description: 'Filter by code, makes use of wildcard search',
  })
  @IsOptional()
  @IsString()
  moduleCode?: string;

  @ApiPropertyOptional({
    example: undefined,
    default: false,
    description: 'Choose to filter modules based of current user enrollments',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    else return false;
  })
  userEnrollment?: boolean;

  // @ApiPropertyOptional({
  //   default: false,
  //   description: 'Used to get the moduel styling and when moduleEnrollment filter is active'
  // })
  // @IsOptional()
  // @IsUUID()
  // @ValidateIf((o)=> o.userEnrollment===true)
  // userId?: string;
} //ModuleFiltersDto

export class ModuleStylingResponseDto {
  @ApiProperty({
    description: 'Describes the state of the success response',
    example: 'Suceess',
    type: String,
  })
  message!: string;
}

export class ModuleStylingBodyDto {
  @ApiProperty({
    description: 'Styling to be used for a Module',
    example: {
      colour: 'FFFFF',
    },
    type: StylingDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => StylingDto)
  styling!: StylingDto;
}

//Enroll response
export class EnrolResponseDto extends PickType(ModulesDto, ['moduleID']) {
  UserID!: string;

  @ApiProperty({
    example:
      'User successfully enrolled into module[00000000-0000-0000-0000-000000000000]',
    description: 'Message to describe success/failure of enrollment',
  })
  message!: string;
} //END_EnrolResponseDto

//Add array of modules to Course
export class AddModulesToCourseDto extends PickType(PopulateGroupBodyDto, [
  'modules',
]) {} //END_AddModulesToCourseDto

export class AddModulesToCourseResponseDto extends AddModulesToCourseDto {
  @ApiProperty({
    description: 'Course to which to add the array of modules',
    type: String,
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsNotEmpty({
    message: `CourseID missing. What you gonna the modules to (facepalm)`,
  })
  @IsUUID('4', { message: 'CourseID should be a UUID' })
  CourseID!: string;
}

export class EnrollToModuleDto {
  @ApiPropertyOptional({
    example: undefined,
    description: 'Enroll or unenroll',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (
      value === 'true' ||
      value === 'TRUE' ||
      value === true ||
      value === 1 ||
      value === '1'
    )
      return true;
    else return false;
  })
  enroll?: boolean;
}
