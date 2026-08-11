import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type {
  PdfParserResult,
  SolverInput,
  SolverPreferences,
  SolverResult,
  WorkerCallbackError,
} from 'shared-types';

const ACTIVITY_TYPES = ['lecture', 'tutorial', 'prac', 'test', 'exam'] as const;
const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export class WorkerCallbackErrorDto implements WorkerCallbackError {
  @ApiProperty({ type: String, example: 'WORKER_FAILED' })
  @IsString()
  code!: string;

  @ApiProperty({ type: String, example: 'Worker failed to process the job' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Worker-specific diagnostic values.',
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}

export class ParseAnnotationDto {
  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  message!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  details!: Record<string, unknown>;
}

export class ParsedModuleCandidateDto {
  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String, nullable: true })
  name!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty({ type: [ParseAnnotationDto] })
  warnings!: ParseAnnotationDto[];
}

class ParsedEventCandidateBaseDto {
  @ApiProperty({ type: String })
  moduleCode!: string;

  @ApiProperty({ enum: ACTIVITY_TYPES })
  activityType!: (typeof ACTIVITY_TYPES)[number];

  @ApiProperty({ type: String })
  activityCode!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String, example: '08:30' })
  startTime!: string;

  @ApiProperty({ type: String, example: '10:20' })
  endTime!: string;

  @ApiProperty({ type: [String] })
  venues!: string[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty({ type: [ParseAnnotationDto] })
  warnings!: ParseAnnotationDto[];
}

export class RecurringParsedEventCandidateDto extends ParsedEventCandidateBaseDto {
  @ApiProperty({ enum: DAYS_OF_WEEK })
  day!: (typeof DAYS_OF_WEEK)[number];

  @ApiProperty({ type: String, nullable: true })
  date!: string | null;

  @ApiProperty({ type: Boolean, enum: [true] })
  isRecurring!: true;
}

export class DatedParsedEventCandidateDto extends ParsedEventCandidateBaseDto {
  @ApiProperty({ type: String, nullable: true })
  day!: string | null;

  @ApiProperty({ type: String, format: 'date' })
  date!: string;

  @ApiProperty({ type: Boolean, enum: [false] })
  isRecurring!: false;
}

@ApiExtraModels(RecurringParsedEventCandidateDto, DatedParsedEventCandidateDto)
export class PdfParserResultDto implements PdfParserResult {
  @ApiProperty({ type: [ParsedModuleCandidateDto] })
  modules!: ParsedModuleCandidateDto[];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RecurringParsedEventCandidateDto) },
        { $ref: getSchemaPath(DatedParsedEventCandidateDto) },
      ],
    },
  })
  events!: PdfParserResult['events'];

  @ApiProperty({ type: [ParseAnnotationDto] })
  warnings!: ParseAnnotationDto[];
}

export class PreferredStartTimePreferenceDto {
  @ApiProperty({
    enum: ['preferred-start-time'],
    example: 'preferred-start-time',
  })
  key!: 'preferred-start-time';

  @ApiProperty({
    type: 'object',
    properties: {
      'minutes-After-midnight': {
        type: 'number',
        minimum: 0,
        maximum: 1440,
        example: 540,
      },
    },
    required: ['minutes-After-midnight'],
  })
  parameters!: {
    'minutes-After-midnight': number;
  };
}

export class LargeGapsPreferenceDto {
  @ApiProperty({
    enum: ['large-gaps'],
    example: 'large-gaps',
  })
  key!: 'large-gaps';
}

export class SmallGapsPreferenceDto {
  @ApiProperty({
    enum: ['small-gaps'],
    example: 'small-gaps',
  })
  key!: 'small-gaps';
}

export class DaySkipPreferenceDto {
  @ApiProperty({
    enum: ['day-skip'],
    example: 'day-skip',
  })
  key!: 'day-skip';

  @ApiProperty({
    type: 'object',
    properties: {
      'day-to-skip': {
        type: 'string',
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        example: 'monday',
      },
    },
    required: ['day-to-skip'],
  })
  parameters!: {
    'day-to-skip': 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  };
}

export type SolverHeuristicPreferenceDto =
  | PreferredStartTimePreferenceDto
  | LargeGapsPreferenceDto
  | SmallGapsPreferenceDto
  | DaySkipPreferenceDto;

@ApiExtraModels(
  PreferredStartTimePreferenceDto,
  LargeGapsPreferenceDto,
  SmallGapsPreferenceDto,
  DaySkipPreferenceDto,
)
export class SolverPreferencesDto implements SolverPreferences {
  @ApiProperty({
    type: 'array',
    default: [],
    items: {
      oneOf: [
        { $ref: getSchemaPath(PreferredStartTimePreferenceDto) },
        { $ref: getSchemaPath(LargeGapsPreferenceDto) },
        { $ref: getSchemaPath(SmallGapsPreferenceDto) },
        { $ref: getSchemaPath(DaySkipPreferenceDto) },
      ],
    },
  })
  heuristics!: SolverHeuristicPreferenceDto[];
}

export class SchedulingVenueDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  name!: string;
}

export class SchedulingEventDto {
  @ApiProperty({ type: String })
  eventId!: string;

  @ApiProperty({ type: String })
  moduleCode!: string;

  @ApiProperty({ enum: ACTIVITY_TYPES })
  activityType!: (typeof ACTIVITY_TYPES)[number];

  @ApiProperty({ type: String })
  activityCode!: string;

  @ApiProperty({ type: Number, minimum: 1, default: 1 })
  requiredSelections!: number;

  @ApiPropertyOptional({ type: String, format: 'date' })
  date?: string;

  @ApiPropertyOptional({ enum: DAYS_OF_WEEK })
  dayOfWeek?: (typeof DAYS_OF_WEEK)[number];

  @ApiProperty({ type: String, example: '08:30' })
  startTime!: string;

  @ApiProperty({ type: String, example: '10:20' })
  endTime!: string;

  @ApiProperty({ type: [SchedulingVenueDto], default: [] })
  venues!: SchedulingVenueDto[];
}

export class SchedulingProblemDto {
  @ApiProperty({ type: [SchedulingEventDto] })
  events!: SchedulingEventDto[];
}

export class SolverInputDto implements SolverInput {
  @ApiProperty({ type: SchedulingProblemDto })
  schedulingProblem!: SchedulingProblemDto;

  @ApiProperty({ type: SolverPreferencesDto })
  preferences!: SolverPreferencesDto;
}

export class TimetableSolutionDto {
  @ApiProperty({ type: [String] })
  selectedEventIds!: string[];
}

export class SolverHeuristicScoreDto {
  @ApiProperty({ type: String })
  key!: string;

  @ApiProperty({ type: Number })
  score!: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  details?: Record<string, unknown>;
}

export class SolverConflictDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    minItems: 2,
    maxItems: 2,
  })
  eventIds!: [string, string];
}

export class SolverResultMetadataDto {
  [key: string]: unknown;

  @ApiProperty({ type: Number, minimum: 0 })
  conflictCount!: number;

  @ApiProperty({ type: [SolverConflictDto] })
  conflicts!: SolverConflictDto[];

  @ApiProperty({ enum: ['feasibility', 'optimization'] })
  solveMode!: 'feasibility' | 'optimization';
}

export class SolverResultDto implements SolverResult {
  @ApiProperty({ enum: ['cp-sat', 'ga'] })
  engine!: 'cp-sat' | 'ga';

  @ApiProperty({ enum: ['conflict-free', 'best-effort'] })
  outcome!: 'conflict-free' | 'best-effort';

  @ApiProperty({ type: TimetableSolutionDto })
  timetableSolution!: TimetableSolutionDto;

  @ApiProperty({ type: [SolverHeuristicScoreDto], default: [] })
  heuristicScores!: SolverHeuristicScoreDto[];

  @ApiProperty({
    type: SolverResultMetadataDto,
    additionalProperties: true,
  })
  metadata!: SolverResultMetadataDto;
}

export class AcceptedJobResponseDto {
  @ApiProperty({ type: Boolean, enum: [true] })
  accepted!: true;

  @ApiProperty({ type: String })
  jobId!: string;
}

export class SolverSubmissionResponseDto extends AcceptedJobResponseDto {
  @ApiProperty({ enum: ['queued', 'completed', 'failed'] })
  status!: 'queued' | 'completed' | 'failed';

  @ApiPropertyOptional({ type: SolverResultDto })
  result?: SolverResult;
}
