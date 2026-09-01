import { ApiProperty } from '@nestjs/swagger';

// Courses per University
export class UniversityCourseStatsDto {
  @ApiProperty()
  UniversityID!: string;

  @ApiProperty({ required: false })
  UniversityName?: string;

  @ApiProperty()
  CourseCount!: number;
}

export class UniversityCourseStatsResponseDto {
  @ApiProperty({ type: [UniversityCourseStatsDto] })
  data!: UniversityCourseStatsDto[];
}

// Modules per Course
export class CourseModuleStatsDto {
  @ApiProperty()
  CourseID!: string;

  @ApiProperty({ required: false })
  CourseName?: string;

  @ApiProperty()
  ModuleCount!: number;
}

export class CourseModuleStatsResponseDto {
  @ApiProperty({ type: [CourseModuleStatsDto] })
  data!: CourseModuleStatsDto[];
}

// Events per Module
export class ModuleEventStatsDto {
  @ApiProperty()
  ModuleID!: string;

  @ApiProperty()
  ModuleCode!: string;

  @ApiProperty({ required: false })
  ModuleName?: string;

  @ApiProperty()
  EventCount!: number;
}

export class ModuleEventStatsResponseDto {
  @ApiProperty({ type: [ModuleEventStatsDto] })
  data!: ModuleEventStatsDto[];
}

// Events per Venue
export class VenueEventStatsDto {
  @ApiProperty()
  VenueID!: string;

  @ApiProperty({ required: false })
  VenueName?: string;

  @ApiProperty()
  EventCount!: number;
}

export class VenueEventStatsResponseDto {
  @ApiProperty({ type: [VenueEventStatsDto] })
  data!: VenueEventStatsDto[];
}

// Attendance submitted per event
export class EventAttendanceStatsDto {
  @ApiProperty()
  EventID!: string;

  @ApiProperty()
  SubmittedCount!: number;
}

export class EventAttendanceStatsResponseDto {
  @ApiProperty({ type: [EventAttendanceStatsDto] })
  data!: EventAttendanceStatsDto[];
}
