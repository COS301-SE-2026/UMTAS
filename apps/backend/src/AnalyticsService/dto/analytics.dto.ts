import { ApiProperty } from '@nestjs/swagger';

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
