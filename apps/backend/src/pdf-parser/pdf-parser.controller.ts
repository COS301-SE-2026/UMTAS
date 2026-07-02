import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  ParseAnnotation,
  ParsedEventCandidate,
  ParsedModuleCandidate,
  PdfParserResult,
} from 'shared-types';
import { Public } from '../auth/auth.guard';
import { WorkerCallbackAuthGuard } from '../jobs/worker-callback-auth.guard';
import { PdfParserCallbackDto } from './dto/pdf-parser-callback.dto';

@Public()
@ApiTags('PDF Parser')
@ApiBearerAuth('bearer')
@UseGuards(WorkerCallbackAuthGuard)
@Controller('pdf-parser')
export class PdfParserController {
  @Post('jobs/:jobId/callback')
  @HttpCode(HttpStatus.ACCEPTED)
  receiveCallback(
    @Param('jobId') jobId: string,
    @Body() body: PdfParserCallbackDto,
  ) {
    validatePdfParserCallback(body);

    // TODO: Persist parser job status and surface import candidates to the UI.
    return { accepted: true, jobId };
  }
}

function validatePdfParserCallback(body: PdfParserCallbackDto): void {
  if (body.status === 'completed') {
    if (!body.result) {
      throw new BadRequestException(
        'Completed parser callbacks require result',
      );
    }
    validateParserResultShape(body.result);
    return;
  }

  if (!body.error?.code || !body.error.message) {
    throw new BadRequestException('Failed parser callbacks require error');
  }
}

function validateParserResultShape(result: PdfParserResult): void {
  assertExactKeys(result, ['events', 'modules', 'warnings'], 'parser result');

  if (!Array.isArray(result.modules)) {
    throw new BadRequestException('Parser result modules must be an array');
  }

  if (!Array.isArray(result.events)) {
    throw new BadRequestException('Parser result events must be an array');
  }

  validateAnnotations(result.warnings, 'parser result warnings');

  for (const moduleCandidate of result.modules) {
    validateModuleCandidate(moduleCandidate);
  }

  for (const eventCandidate of result.events) {
    validateEventCandidate(eventCandidate);
  }
}

function validateModuleCandidate(candidate: ParsedModuleCandidate): void {
  assertExactKeys(
    candidate,
    ['code', 'metadata', 'name', 'warnings'],
    'module candidate',
  );
  if (typeof candidate.code !== 'string') {
    throw new BadRequestException('Module candidate code must be a string');
  }
  if (candidate.name !== null && typeof candidate.name !== 'string') {
    throw new BadRequestException(
      'Module candidate name must be a string or null',
    );
  }
  if (!isRecord(candidate.metadata)) {
    throw new BadRequestException(
      'Module candidate metadata must be an object',
    );
  }
  validateAnnotations(candidate.warnings, 'module candidate warnings');
}

function validateEventCandidate(candidate: ParsedEventCandidate): void {
  assertExactKeys(
    candidate,
    [
      'date',
      'day',
      'endTime',
      'isRecurring',
      'metadata',
      'moduleCode',
      'sectionLabel',
      'startTime',
      'title',
      'type',
      'venues',
      'warnings',
    ],
    'event candidate',
  );

  const stringFields = [
    'moduleCode',
    'type',
    'sectionLabel',
    'title',
    'startTime',
    'endTime',
  ] as const;

  for (const key of stringFields) {
    if (typeof candidate[key] !== 'string') {
      throw new BadRequestException(`Event candidate ${key} must be a string`);
    }
  }

  if (candidate.day !== null && typeof candidate.day !== 'string') {
    throw new BadRequestException(
      'Event candidate day must be a string or null',
    );
  }

  if (candidate.date !== null && typeof candidate.date !== 'string') {
    throw new BadRequestException(
      'Event candidate date must be a string or null',
    );
  }

  if (!Array.isArray(candidate.venues)) {
    throw new BadRequestException('Event candidate venues must be an array');
  }

  for (const venue of candidate.venues) {
    if (typeof venue !== 'string') {
      throw new BadRequestException('Event candidate venues must be strings');
    }
  }

  if (typeof candidate.isRecurring !== 'boolean') {
    throw new BadRequestException(
      'Event candidate isRecurring must be a boolean',
    );
  }

  if (!isRecord(candidate.metadata)) {
    throw new BadRequestException('Event candidate metadata must be an object');
  }

  validateAnnotations(candidate.warnings, 'event candidate warnings');
}

function validateAnnotations(
  annotations: ParseAnnotation[] | undefined,
  label: string,
): void {
  if (!Array.isArray(annotations)) {
    throw new BadRequestException(`${label} must be an array`);
  }
  for (const annotation of annotations) {
    assertExactKeys(annotation, ['code', 'details', 'message'], label);

    if (typeof annotation.code !== 'string') {
      throw new BadRequestException(`${label} code must be a string`);
    }

    if (typeof annotation.message !== 'string') {
      throw new BadRequestException(`${label} message must be a string`);
    }

    if (!isRecord(annotation.details)) {
      throw new BadRequestException(`${label} details must be an object`);
    }
  }
}

function assertExactKeys(
  value: unknown,
  expectedKeys: string[],
  label: string,
): void {
  if (!isRecord(value)) {
    throw new BadRequestException(`${label} must be an object`);
  }

  const actualKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  const expected = expectedKeys.slice().sort((a, b) => a.localeCompare(b));

  if (!hasSameKeys(actualKeys, expected)) {
    throw new BadRequestException(
      `${label} must contain exactly: ${expected.join(', ')}`,
    );
  }
}

function hasSameKeys(actualKeys: string[], expectedKeys: string[]): boolean {
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  for (let index = 0; index < actualKeys.length; index += 1) {
    if (actualKeys[index] !== expectedKeys[index]) {
      return false;
    }
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
